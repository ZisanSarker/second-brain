import { Test, TestingModule } from '@nestjs/testing';
import { OpenRouterProvider } from '../chat/providers/openrouter.provider';
import { ToolRegistry } from './tools/tool-registry';
import { TaskPlannerService } from './task-planner.service';

describe('TaskPlannerService', () => {
  let service: TaskPlannerService;
  let llmProvider: any;
  let toolRegistry: any;

  const mockTools = [
    { name: 'web_search', description: 'Search the web', inputSchema: { query: 'string' } },
  ];

  const mockLlmProvider = {
    generateChat: jest.fn(),
  };

  const mockToolRegistry = {
    getToolSchemas: jest.fn().mockReturnValue(mockTools),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskPlannerService,
        { provide: OpenRouterProvider, useValue: mockLlmProvider },
        { provide: ToolRegistry, useValue: mockToolRegistry },
      ],
    }).compile();

    service = module.get<TaskPlannerService>(TaskPlannerService);
    llmProvider = module.get(OpenRouterProvider);
    toolRegistry = module.get(ToolRegistry);
    jest.clearAllMocks();
  });

  describe('createPlan', () => {
    it('should return steps and reasoning from LLM response', async () => {
      const llmResponse = {
        content: JSON.stringify({
          reasoning: 'First search the web, then summarize',
          steps: [
            {
              type: 'TOOL_CALL',
              tool: 'web_search',
              input: { query: 'latest AI news' },
              description: 'Search for AI news',
            },
            { type: 'LLM_REASONING', tool: null, input: {}, description: 'Summarize results' },
          ],
        }),
      };
      mockLlmProvider.generateChat.mockResolvedValue(llmResponse);

      const result = await service.createPlan(
        'ws-1',
        'Find latest AI news',
        'research',
        'You are helpful',
        ['web_search'],
      );

      expect(mockToolRegistry.getToolSchemas).toHaveBeenCalledWith(['web_search']);
      expect(mockLlmProvider.generateChat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Find latest AI news' }),
          ]),
          temperature: 0.3,
        }),
      );
      expect(result.steps).toHaveLength(2);
      expect(result.reasoning).toBe('First search the web, then summarize');
    });

    it('should return fallback step when JSON parse fails', async () => {
      mockLlmProvider.generateChat.mockResolvedValue({ content: 'non-json response here' });

      const result = await service.createPlan(
        'ws-1',
        'Do something',
        'research',
        'You are helpful',
        [],
      );

      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toEqual({
        type: 'LLM_REASONING',
        tool: null,
        input: { task: 'Do something' },
        description: 'Process request',
      });
      expect(result.reasoning).toBe('non-json response here');
    });

    it('should handle empty steps in LLM response', async () => {
      mockLlmProvider.generateChat.mockResolvedValue({
        content: JSON.stringify({ reasoning: 'No steps needed', steps: [] }),
      });

      const result = await service.createPlan('ws-1', 'Hello', 'research', 'You are helpful', []);

      expect(result.steps).toEqual([]);
      expect(result.reasoning).toBe('No steps needed');
    });

    it('should handle missing fields in LLM response', async () => {
      mockLlmProvider.generateChat.mockResolvedValue({
        content: JSON.stringify({}),
      });

      const result = await service.createPlan('ws-1', 'Hello', 'research', 'You are helpful', []);

      expect(result.steps).toEqual([]);
      expect(result.reasoning).toBe('');
    });
  });
});
