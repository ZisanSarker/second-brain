import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../shared/services/prisma.service';
import { AiService } from '../ai/ai.service';
import { SearchHitDto, SearchResultsDto } from './dto/search-result.dto';
import { SearchSuggestionDto } from './dto/suggestion.dto';
import { SearchHistoryEntryDto, SaveSearchHistoryDto } from './dto/search-history.dto';
import { SearchMode } from './dto/search-query.dto';

interface SearchParams {
  query?: string;
  mode?: SearchMode;
  collectionId?: string;
  folderId?: string;
  tagId?: string;
  tagIds?: string[];
  fileType?: string;
  author?: string;
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  keywordWeight?: number;
  semanticWeight?: number;
}

@Injectable()
export class SearchService {
  private readonly defaultKwWeight = 0.4;
  private readonly defaultSemWeight = 0.6;

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async search(
    workspaceId: string,
    userId: string,
    params: SearchParams,
  ): Promise<SearchResultsDto> {
    await this.requireMember(workspaceId, userId);

    const query = params.query?.trim() || '';
    const mode = params.mode || SearchMode.HYBRID;
    const kwWeight = params.keywordWeight ?? this.defaultKwWeight;
    const semWeight = params.semanticWeight ?? this.defaultSemWeight;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const start = Date.now();

    // Resolve tagIds if tagId is provided (backwards compat)
    const resolvedTagIds = params.tagIds || [];
    if (params.tagId && !resolvedTagIds.includes(params.tagId)) {
      resolvedTagIds.push(params.tagId);
    }

    // Keyword search
    let keywordHits: SearchHitDto[] = [];
    if (mode === SearchMode.KEYWORD || mode === SearchMode.HYBRID) {
      keywordHits = await this.keywordSearch(workspaceId, query, resolvedTagIds, params);
    }

    // Semantic search
    let semanticHits: SearchHitDto[] = [];
    if ((mode === SearchMode.SEMANTIC || mode === SearchMode.HYBRID) && query.length > 0) {
      semanticHits = await this.semanticSearch(workspaceId, query, resolvedTagIds, params, limit);
    }

    // Hybrid merge
    let merged: SearchHitDto[];
    if (mode === SearchMode.HYBRID && query.length > 0) {
      merged = this.hybridMerge(keywordHits, semanticHits, kwWeight, semWeight);
    } else if (mode === SearchMode.KEYWORD || !query) {
      merged = keywordHits;
    } else {
      merged = semanticHits;
    }

    // Apply filters & permissions
    merged = await this.applyFiltersAndPermissions(merged, workspaceId, params);

    // Rerank
    merged = this.rerank(merged);

    // Total before pagination
    const total = merged.length;
    const paged = merged.slice(offset, offset + limit);

    // Save search history
    if (query) {
      await this.saveHistory(workspaceId, userId, {
        query,
        filters: params as any,
        resultCount: total,
      });
    }

    return {
      data: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query,
      mode,
      took: Date.now() - start,
    };
  }

  private async keywordSearch(
    workspaceId: string,
    query: string,
    tagIds: string[],
    params: SearchParams,
  ): Promise<SearchHitDto[]> {
    if (!query) {
      return this.metadataSearch(workspaceId, '', params);
    }

    const terms = query.trim().split(/\s+/).filter(Boolean);
    const shortQuery = query.length < 3;

    // Build base document filter
    const docFilter: string[] = [
      `d."workspaceId" = ${this.escape(workspaceId)}`,
      `d."deletedAt" IS NULL`,
    ];
    const joins: string[] = [];
    const having: string[] = [];

    if (tagIds.length > 0) {
      joins.push(`JOIN "_DocumentTags" dt ON dt."A" = d.id`);
      const escaped = tagIds.map((t) => `'${t.replace(/'/g, "''")}'`);
      docFilter.push(`dt."B" IN (${escaped.join(',')})`);
    }
    if (params.collectionId) {
      docFilter.push(`d."collectionId" = ${this.escape(params.collectionId)}`);
    }
    if (params.folderId) {
      docFilter.push(`d."folderId" = ${this.escape(params.folderId)}`);
    }
    if (params.fileType) {
      docFilter.push(`d."fileType" = ${this.escape(params.fileType)}`);
    }
    if (params.author) {
      docFilter.push(`d."author" ILIKE ${this.escape(`%${params.author}%`)}`);
    }
    if (params.dateFrom) {
      docFilter.push(`d."createdAt" >= ${this.escape(params.dateFrom)}::timestamp`);
    }
    if (params.dateTo) {
      docFilter.push(`d."createdAt" <= ${this.escape(params.dateTo)}::timestamp`);
    }

    const docWhere = docFilter.join(' AND ');

    let sql: string;
    let hits: SearchHitDto[];

    if (shortQuery) {
      // pg_trgm ILIKE prefix matching for short queries
      sql = `
        SELECT d.id, d.title, d.description, d."fileType", d.author, d.language,
               d."updatedAt", d."collectionId", d."sourceType",
               c.id as "chunkId", c."chunkIndex", c."pageNumber", c.section, c.content,
               c."charStart",
               similarity(c.content, ${this.escape(query)}) as score
        FROM "DocumentChunk" c
        JOIN "DocumentVersion" dv ON dv.id = c."versionId"
        JOIN "Document" d ON d.id = dv."documentId"
        ${joins.join(' ')}
        WHERE ${docWhere}
          AND c.content ILIKE ${this.escape(`%${query}%`)}
        ORDER BY score DESC
        LIMIT 100
      `;
    } else {
      // PostgreSQL full-text search
      const tsquery = terms
        .map((t) => t.replace(/[^\w\s]/g, ''))
        .filter(Boolean)
        .map((t) => `${t}:*`)
        .join(' & ');

      if (!tsquery) {
        return this.metadataSearch(workspaceId, query, params);
      }

      sql = `
        SELECT d.id, d.title, d.description, d."fileType", d.author, d.language,
               d."updatedAt", d."collectionId", d."sourceType",
               c.id as "chunkId", c."chunkIndex", c."pageNumber", c.section, c.content,
               c."charStart",
               ts_rank_cd(
                 to_tsvector('english', coalesce(c.content, '')),
                 to_tsquery('english', ${this.escape(tsquery)})
               ) as score
        FROM "DocumentChunk" c
        JOIN "DocumentVersion" dv ON dv.id = c."versionId"
        JOIN "Document" d ON d.id = dv."documentId"
        ${joins.join(' ')}
        WHERE ${docWhere}
          AND to_tsvector('english', coalesce(c.content, '')) @@ to_tsquery('english', ${this.escape(tsquery)})
        ORDER BY score DESC
        LIMIT 100
      `;
    }

    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql);
    const docMap = new Map<string, SearchHitDto>();

    for (const row of rows) {
      if (!docMap.has(row.id)) {
        docMap.set(row.id, {
          documentId: row.id,
          title: row.title || 'Untitled',
          description: row.description || undefined,
          source: row.id,
          sourceType: row.sourceType || 'document',
          score: 0,
          keywordScore: 0,
          matchedContent: row.content?.slice(0, 300) || '',
          chunkIndex: row.chunkIndex ?? undefined,
          pageNumber: row.pageNumber ?? undefined,
          section: row.section || undefined,
          fileType: row.fileType || undefined,
          author: row.author || undefined,
          language: row.language || undefined,
          updatedAt: row.updatedAt?.toISOString?.() || String(row.updatedAt),
          collectionId: row.collectionId || undefined,
        });
      }
      const hit = docMap.get(row.id)!;
      const rowScore = Number(row.score) || 0;
      if (rowScore > hit.keywordScore!) {
        hit.keywordScore = rowScore;
        hit.matchedContent = row.content?.slice(0, 300) || '';
        hit.chunkIndex = row.chunkIndex ?? undefined;
        hit.pageNumber = row.pageNumber ?? undefined;
        hit.section = row.section || undefined;
      }
    }

    hits = Array.from(docMap.values());
    // Normalize keyword scores
    const maxKw = Math.max(...hits.map((h) => h.keywordScore!), 1);
    hits.forEach((h) => (h.keywordScore = maxKw > 0 ? h.keywordScore! / maxKw : 0));

    return hits;
  }

  private async metadataSearch(
    workspaceId: string,
    query: string,
    params: SearchParams,
  ): Promise<SearchHitDto[]> {
    const where: Prisma.DocumentWhereInput = {
      workspaceId,
      deletedAt: null,
    };
    const conditions: Prisma.DocumentWhereInput[] = [];

    if (query) {
      conditions.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { originalName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
        ],
      });
    }
    if (params.collectionId) conditions.push({ collectionId: params.collectionId });
    if (params.folderId) conditions.push({ folderId: params.folderId });
    if (params.fileType) conditions.push({ fileType: params.fileType });
    if (params.author)
      conditions.push({ author: { contains: params.author, mode: 'insensitive' } });
    if (params.dateFrom) conditions.push({ createdAt: { gte: new Date(params.dateFrom) } });
    if (params.dateTo) conditions.push({ createdAt: { lte: new Date(params.dateTo) } });
    if (params.tagId) conditions.push({ tags: { some: { id: params.tagId } } });
    if (params.tagIds?.length) conditions.push({ tags: { some: { id: { in: params.tagIds } } } });
    if (params.language) conditions.push({ language: params.language });

    if (conditions.length > 0) where.AND = conditions;

    const docs = await this.prisma.document.findMany({
      where,
      include: {
        collection: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
        tags: { select: { id: true, name: true, color: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return docs.map((d) => ({
      documentId: d.id,
      title: d.title || 'Untitled',
      description: d.description || undefined,
      source: d.id,
      sourceType: d.sourceType || 'document',
      score: 1,
      keywordScore: 1,
      matchedContent: d.description || d.title || '',
      fileType: d.fileType || undefined,
      author: d.author || undefined,
      language: d.language || undefined,
      updatedAt: d.updatedAt.toISOString(),
      tags: d.tags?.map((t) => ({ id: t.id, name: t.name, color: t.color || undefined })),
      collectionId: d.collectionId || undefined,
      collectionName: d.collection?.name,
      folderName: d.folder?.name,
    }));
  }

  private async semanticSearch(
    workspaceId: string,
    query: string,
    tagIds: string[],
    params: SearchParams,
    limit: number,
  ): Promise<SearchHitDto[]> {
    try {
      const hits = await this.ai.search(
        query,
        workspaceId,
        limit,
        undefined,
        params.collectionId,
        tagIds.length > 0 ? tagIds : undefined,
        params.language,
      );

      return hits.map((h) => {
        const meta = h.metadata || {};
        return {
          documentId: h.document_id,
          title: (meta as any).title || 'Untitled',
          description: (meta as any).description || undefined,
          source: h.document_id,
          sourceType: (meta as any).source_type || 'document',
          score: h.score,
          semanticScore: h.score,
          matchedContent: h.text?.slice(0, 300) || '',
          chunkIndex: h.chunk_index ?? undefined,
          pageNumber: h.page_number ?? undefined,
          section: h.section || undefined,
          fileType: (meta as any).file_type || undefined,
          author: (meta as any).author || undefined,
          language: (meta as any).language || undefined,
          updatedAt: (meta as any).updated_at || new Date().toISOString(),
          tags: (meta as any).tags?.map((t: any) =>
            typeof t === 'string' ? { id: t, name: t } : t,
          ),
          collectionId: (meta as any).collection_id || undefined,
          collectionName: (meta as any).collection_name || undefined,
        };
      });
    } catch {
      return [];
    }
  }

  private hybridMerge(
    keyword: SearchHitDto[],
    semantic: SearchHitDto[],
    kwWeight: number,
    semWeight: number,
  ): SearchHitDto[] {
    const map = new Map<string, SearchHitDto>();

    for (const hit of keyword) {
      hit.keywordScore ??= 0;
      map.set(hit.documentId, hit);
    }

    for (const hit of semantic) {
      hit.semanticScore ??= 0;
      const existing = map.get(hit.documentId);
      if (existing) {
        existing.semanticScore = hit.semanticScore;
        if (!existing.matchedContent && hit.matchedContent) {
          existing.matchedContent = hit.matchedContent;
          existing.chunkIndex = hit.chunkIndex;
          existing.pageNumber = hit.pageNumber;
          existing.section = hit.section;
        }
        if (!existing.tags && hit.tags) existing.tags = hit.tags;
        if (!existing.collectionName && hit.collectionName)
          existing.collectionName = hit.collectionName;
      } else {
        hit.keywordScore = 0;
        map.set(hit.documentId, hit);
      }
    }

    const results = Array.from(map.values());
    for (const hit of results) {
      const kw = hit.keywordScore ?? 0;
      const sem = hit.semanticScore ?? 0;
      hit.score = kw * kwWeight + sem * semWeight;
    }

    return results;
  }

  private async applyFiltersAndPermissions(
    hits: SearchHitDto[],
    workspaceId: string,
    params: SearchParams,
  ): Promise<SearchHitDto[]> {
    if (hits.length === 0) return [];

    // Permission filter: only return documents the user can access
    const docIds = hits.map((h) => h.documentId);
    const docs = await this.prisma.document.findMany({
      where: { id: { in: docIds }, workspaceId, deletedAt: null },
      select: {
        id: true,
        collectionId: true,
        folderId: true,
        language: true,
        fileType: true,
        author: true,
        tags: { select: { id: true, name: true, color: true } },
        collection: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
      },
    });
    const validIds = new Set(docs.map((d) => d.id));

    let filtered = hits.filter((h) => validIds.has(h.documentId));

    // Enrich with metadata from DB
    const docMap = new Map(docs.map((d) => [d.id, d]));
    filtered = filtered.map((h) => {
      const d = docMap.get(h.documentId);
      if (!d) return h;
      return {
        ...h,
        tags: d.tags?.map((t) => ({ id: t.id, name: t.name, color: t.color || undefined })),
        collectionId: d.collectionId || undefined,
        collectionName: d.collection?.name,
        folderName: d.folder?.name,
        language: d.language || undefined,
        fileType: d.fileType || undefined,
        author: d.author || undefined,
      };
    });

    return filtered;
  }

  private rerank(hits: SearchHitDto[]): SearchHitDto[] {
    // Freshness boost: documents updated within last 90 days get a boost
    const now = Date.now();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    for (const hit of hits) {
      const updated = new Date(hit.updatedAt).getTime();
      const daysSinceUpdate = (now - updated) / (24 * 60 * 60 * 1000);
      const freshnessBoost = 1 + 0.1 * Math.min(1, (90 - daysSinceUpdate) / 90);
      hit.score *= freshnessBoost;
    }

    return hits.sort((a, b) => b.score - a.score);
  }

  // --- Suggestions ---

  async suggestions(
    workspaceId: string,
    userId: string,
    prefix: string,
  ): Promise<SearchSuggestionDto[]> {
    await this.requireMember(workspaceId, userId);

    if (!prefix || prefix.length < 1) return [];

    const results: SearchSuggestionDto[] = [];
    const escaped = `'${prefix.replace(/'/g, "''")}%'`;

    // Recent queries (from search history)
    const recentQueries = await this.prisma.$queryRawUnsafe<{ query: string }[]>(
      `SELECT DISTINCT query FROM "SearchHistory"
       WHERE "workspaceId" = $1 AND "userId" = $2 AND query ILIKE ${escaped}
       ORDER BY "createdAt" DESC LIMIT 5`,
      workspaceId,
      userId,
    );
    for (const r of recentQueries) {
      results.push({ text: r.query, type: 'query' });
    }

    // Document titles (prefix)
    const docs = await this.prisma.$queryRawUnsafe<{ id: string; title: string }[]>(
      `SELECT id, title FROM "Document"
       WHERE "workspaceId" = $1 AND "deletedAt" IS NULL AND title ILIKE ${escaped}
       LIMIT 5`,
      workspaceId,
    );
    for (const d of docs) {
      results.push({ text: d.title, type: 'document', id: d.id });
    }

    // Tags
    const tags = await this.prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
      `SELECT id, name FROM "Tag"
       WHERE "workspaceId" = $1 AND name ILIKE ${escaped}
       LIMIT 3`,
      workspaceId,
    );
    for (const t of tags) {
      results.push({ text: t.name, type: 'tag', id: t.id, subtitle: 'Tag' });
    }

    // Collections
    const collections = await this.prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
      `SELECT id, name FROM "Collection"
       WHERE "workspaceId" = $1 AND name ILIKE ${escaped}
       LIMIT 3`,
      workspaceId,
    );
    for (const c of collections) {
      results.push({ text: c.name, type: 'collection', id: c.id, subtitle: 'Collection' });
    }

    return results;
  }

  // --- History ---

  async searchHistory(workspaceId: string, userId: string): Promise<SearchHistoryEntryDto[]> {
    const rows = await this.prisma.searchHistory.findMany({
      where: { workspaceId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      distinct: ['query'],
    });
    return rows.map((r) => ({
      id: r.id,
      query: r.query,
      filters: r.filters as Record<string, unknown> | undefined,
      resultCount: r.resultCount ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async saveHistory(workspaceId: string, userId: string, dto: SaveSearchHistoryDto): Promise<void> {
    await this.prisma.searchHistory.create({
      data: {
        workspaceId,
        userId,
        query: dto.query,
        filters: dto.filters as any,
        resultCount: dto.resultCount,
      },
    });
  }

  async deleteHistory(workspaceId: string, userId: string, historyId: string): Promise<void> {
    await this.prisma.searchHistory.deleteMany({
      where: { id: historyId, workspaceId, userId },
    });
  }

  // --- Related Documents ---

  async relatedDocuments(
    workspaceId: string,
    userId: string,
    documentId: string,
    limit = 5,
  ): Promise<{ documentId: string; title: string; score: number }[]> {
    await this.requireMember(workspaceId, userId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, workspaceId, deletedAt: null },
      select: { id: true, tags: { select: { id: true } } },
    });
    if (!doc) return [];

    const tagIds = doc.tags.map((t) => t.id);
    if (tagIds.length === 0) return [];

    const related = await this.prisma.document.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        id: { not: documentId },
        tags: { some: { id: { in: tagIds } } },
      },
      select: { id: true, title: true },
      take: limit,
    });

    return related.map((r) => ({
      documentId: r.id,
      title: r.title || 'Untitled',
      score: 1,
    }));
  }

  // --- Helpers ---

  private escape(val: string): string {
    return `'${val.replace(/'/g, "''")}'`;
  }

  private async requireMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
  }
}
