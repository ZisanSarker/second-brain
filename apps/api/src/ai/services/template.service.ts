import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

const DEFAULT_TEMPLATES = [
  {
    name: 'Executive Summary',
    type: 'SUMMARY',
    systemPrompt:
      'You are an expert at creating concise executive summaries. Summarize the following content in 2-3 paragraphs, focusing on key findings, conclusions, and actionable insights. Use professional language.',
    userPrompt: null,
    isDefault: true,
  },
  {
    name: 'Bullet Summary',
    type: 'SUMMARY',
    systemPrompt:
      'Create a bullet-point summary of the following content. Use short, impactful bullet points. Group related points under headings.',
    userPrompt: null,
    isDefault: true,
  },
  {
    name: 'Technical Summary',
    type: 'SUMMARY',
    systemPrompt:
      'You are a technical writer. Summarize the following content with precision. Include technical details, terminology, code references, and specifications where relevant.',
    userPrompt: null,
    isDefault: true,
  },
  {
    name: 'Study Summary',
    type: 'SUMMARY',
    systemPrompt:
      'Create a study-friendly summary. Use headings, subheadings, and bullet points. Highlight key terms in **bold**. Include a "Key Concepts" section and a "Review Questions" section at the end.',
    userPrompt: null,
    isDefault: true,
  },
  {
    name: 'Flashcards',
    type: 'FLASHCARD',
    systemPrompt:
      'Generate flashcards from the following content. Each flashcard must have a question on the front and answer on the back. Cover main concepts, definitions, and important details.',
    userPrompt:
      'Generate 10 flashcards. Output as JSON array with objects: {"front": "...", "back": "...", "topic": "..."}',
    isDefault: true,
  },
  {
    name: 'Multiple Choice Quiz',
    type: 'QUIZ',
    systemPrompt:
      'Create a quiz from the following content. Questions should test understanding, not just recall. Include a mix of concept questions and detail questions.',
    userPrompt:
      'Generate 5 multiple choice questions. Output as JSON array with objects: {"question": "...", "options": ["...", "..."], "correctIndex": 0, "explanation": "..."}',
    isDefault: true,
  },
  {
    name: 'AI Notes',
    type: 'NOTES',
    systemPrompt:
      'Transform the following content into well-structured study notes. Use markdown formatting with headings, bullet lists, code blocks, and callouts (marked with > for important notes). Include a summary at the top.',
    userPrompt: null,
    isDefault: true,
  },
  {
    name: 'Mind Map',
    type: 'MINDMAP',
    systemPrompt:
      'Extract the hierarchical structure from the following content. Identify the main topic, subtopics, and their relationships. Output as a nested JSON structure.',
    userPrompt: 'Output as JSON: {"topic": "...", "children": [{"topic": "...", "children": []}]}',
    isDefault: true,
  },
  {
    name: "Explain Like I'm 5",
    type: 'ELI5',
    systemPrompt:
      'Explain the following content as if explaining to a 5-year-old. Use simple words, analogies, and examples. Make it fun and engaging. Avoid jargon.',
    userPrompt: null,
    isDefault: true,
  },
  {
    name: 'Key Takeaways',
    type: 'TAKEAWAYS',
    systemPrompt:
      'Extract the most important takeaways from the following content. List 5-10 key points that the reader should remember. Each takeaway should be a single clear sentence.',
    userPrompt: null,
    isDefault: true,
  },
  {
    name: 'Action Items',
    type: 'ACTION_ITEMS',
    systemPrompt:
      'Extract action items and next steps from the following content. Each item should include: what needs to be done, who is responsible (if mentioned), and priority level. Output as a JSON array.',
    userPrompt: null,
    isDefault: true,
  },
  {
    name: 'Timeline',
    type: 'TIMELINE',
    systemPrompt:
      'Extract chronological events and dates from the following content. Create a timeline ordered by date. Include event descriptions and significance. Output as JSON array: [{"date": "...", "event": "...", "description": "..."}]',
    userPrompt: null,
    isDefault: true,
  },
  {
    name: 'Glossary',
    type: 'GLOSSARY',
    systemPrompt:
      'Create a glossary of important terms from the following content. Each entry should include the term, a clear definition, and optionally the context where it appears. Output as JSON array: [{"term": "...", "definition": "...", "context": "..."}]',
    userPrompt: null,
    isDefault: true,
  },
  {
    name: 'FAQ',
    type: 'FAQ',
    systemPrompt:
      'Generate frequently asked questions about the following content. Include questions someone new to the topic might ask, as well as deeper questions for those already familiar. Output as JSON array: [{"question": "...", "answer": "..."}]',
    userPrompt: null,
    isDefault: true,
  },
];

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async seedDefaults(workspaceId: string) {
    const existing = await this.prisma.aiTemplate.findFirst({
      where: { workspaceId, isDefault: true },
    });
    if (existing) return;

    for (const tpl of DEFAULT_TEMPLATES) {
      await this.prisma.aiTemplate.create({
        data: { workspaceId, ...tpl },
      });
    }
  }

  async list(workspaceId: string, type?: string) {
    const where: any = { workspaceId };
    if (type) where.type = type;
    return this.prisma.aiTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async getById(workspaceId: string, id: string) {
    const tpl = await this.prisma.aiTemplate.findFirst({ where: { id, workspaceId } });
    if (!tpl) throw new NotFoundException('Template not found');
    return tpl;
  }

  async resolve(workspaceId: string, type: string): Promise<any> {
    const tpl = await this.prisma.aiTemplate.findFirst({
      where: { workspaceId, type, isDefault: true },
    });
    if (tpl) return tpl;
    const anyTpl = await this.prisma.aiTemplate.findFirst({ where: { workspaceId, type } });
    if (anyTpl) return anyTpl;
    return DEFAULT_TEMPLATES.find((t) => t.type === type) || DEFAULT_TEMPLATES[0];
  }

  async create(
    workspaceId: string,
    data: {
      name: string;
      type: string;
      systemPrompt: string;
      userPrompt?: string;
      outputSchema?: any;
    },
  ) {
    return this.prisma.aiTemplate.create({ data: { workspaceId, ...data } });
  }

  async update(
    workspaceId: string,
    id: string,
    data: Partial<{
      name: string;
      systemPrompt: string;
      userPrompt: string;
      outputSchema: any;
      isDefault: boolean;
    }>,
  ) {
    const tpl = await this.prisma.aiTemplate.findFirst({ where: { id, workspaceId } });
    if (!tpl) throw new NotFoundException('Template not found');
    return this.prisma.aiTemplate.update({
      where: { id },
      data: { ...data, version: tpl.version + 1 },
    });
  }

  async delete(workspaceId: string, id: string) {
    const tpl = await this.prisma.aiTemplate.findFirst({ where: { id, workspaceId } });
    if (!tpl) throw new NotFoundException('Template not found');
    await this.prisma.aiTemplate.delete({ where: { id } });
  }
}
