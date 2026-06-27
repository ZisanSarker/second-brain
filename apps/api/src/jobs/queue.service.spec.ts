import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { QueueService } from './queue.service';

const mockQueue = {
  add: jest.fn(),
};

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockQueue.add.mockResolvedValue({ id: 'job-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: getQueueToken('documents'), useValue: mockQueue },
        { provide: getQueueToken('imports'), useValue: mockQueue },
        { provide: getQueueToken('ai-generation'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  describe('enqueueProcessDocument', () => {
    it('should add a document.process job', async () => {
      const jobId = await service.enqueueProcessDocument('doc-1', 'ws-1', 'ver-1');
      expect(jobId).toBe('job-1');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'document.process',
        { documentId: 'doc-1', workspaceId: 'ws-1', versionId: 'ver-1' },
        expect.objectContaining({ attempts: 5 }),
      );
    });
  });

  describe('enqueueReprocessDocument', () => {
    it('should add a document.reprocess job', async () => {
      const jobId = await service.enqueueReprocessDocument('doc-1', 'ws-1');
      expect(jobId).toBe('job-1');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'document.reprocess',
        { documentId: 'doc-1', workspaceId: 'ws-1' },
        expect.any(Object),
      );
    });
  });

  describe('enqueueDeleteVectors', () => {
    it('should add a document.delete-vectors job', async () => {
      await service.enqueueDeleteVectors('doc-1');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'document.delete-vectors',
        { documentId: 'doc-1' },
        expect.any(Object),
      );
    });
  });

  describe('enqueueWebsiteImport', () => {
    it('should add an import.website job', async () => {
      const jobId = await service.enqueueWebsiteImport('ws-1', 'user-1', 'https://example.com');
      expect(jobId).toBe('job-1');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'import.website',
        {
          workspaceId: 'ws-1',
          userId: 'user-1',
          url: 'https://example.com',
          collectionId: undefined,
          folderId: undefined,
        },
        expect.objectContaining({ attempts: 3 }),
      );
    });
  });

  describe('enqueueGitHubImport', () => {
    it('should add an import.github job', async () => {
      await service.enqueueGitHubImport('ws-1', 'user-1', 'owner/repo', 'main');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'import.github',
        expect.objectContaining({ repository: 'owner/repo', branch: 'main' }),
        expect.any(Object),
      );
    });
  });

  describe('enqueueYouTubeImport', () => {
    it('should add an import.youtube job', async () => {
      await service.enqueueYouTubeImport('ws-1', 'user-1', 'video123', ['en']);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'import.youtube',
        expect.objectContaining({ videoId: 'video123', languages: ['en'] }),
        expect.any(Object),
      );
    });
  });

  describe('enqueueGenerateSummary', () => {
    it('should add a generate.summary job', async () => {
      await service.enqueueGenerateSummary('doc-1', 'long text');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'generate.summary',
        { documentId: 'doc-1', text: 'long text' },
        expect.any(Object),
      );
    });

    it('should truncate text to 8000 chars', async () => {
      const longText = 'x'.repeat(10000);
      await service.enqueueGenerateSummary('doc-1', longText);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'generate.summary',
        { documentId: 'doc-1', text: 'x'.repeat(8000) },
        expect.any(Object),
      );
    });
  });

  describe('enqueueGenerateTags', () => {
    it('should add a generate.tags job', async () => {
      await service.enqueueGenerateTags('doc-1', 'text');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'generate.tags',
        { documentId: 'doc-1', text: 'text' },
        expect.any(Object),
      );
    });
  });

  describe('enqueueGenerateKeywords', () => {
    it('should add a generate.keywords job', async () => {
      await service.enqueueGenerateKeywords('doc-1', 'text');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'generate.keywords',
        { documentId: 'doc-1', text: 'text' },
        expect.any(Object),
      );
    });
  });
});
