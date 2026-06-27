import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { BaseAgent } from './agents/base-agent';
import { AgentRouterService } from './agent-router.service';

describe('AgentRouterService', () => {
  let service: AgentRouterService;
  let moduleRef: any;

  const mockAgent: BaseAgent = {
    type: 'research',
    name: 'Research Agent',
    description: 'Performs research tasks',
    defaultTools: ['web_search', 'document_read'],
    systemPrompt: 'You are a research assistant',
    execute: jest.fn(),
  } as any;

  const mockAgent2: BaseAgent = {
    type: 'coding',
    name: 'Coding Agent',
    description: 'Performs coding tasks',
    defaultTools: ['code_edit', 'terminal'],
    systemPrompt: 'You are a coding assistant',
    execute: jest.fn(),
  } as any;

  const mockModuleRef = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentRouterService, { provide: ModuleRef, useValue: mockModuleRef }],
    }).compile();

    service = module.get<AgentRouterService>(AgentRouterService);
    moduleRef = module.get(ModuleRef);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register agent by type', () => {
      service.register(mockAgent);

      const registered = service.getAgent('research');
      expect(registered).toBe(mockAgent);
    });

    it('should register multiple agents', () => {
      service.register(mockAgent);
      service.register(mockAgent2);

      const agents = service.listAgents();
      expect(agents).toHaveLength(2);
    });
  });

  describe('getAgent', () => {
    it('should return registered agent', () => {
      service.register(mockAgent);

      const result = service.getAgent('research');

      expect(result.type).toBe('research');
      expect(result.name).toBe('Research Agent');
    });

    it('should throw for unknown type', () => {
      expect(() => service.getAgent('unknown')).toThrow('Unknown agent type: unknown');
    });
  });

  describe('listAgents', () => {
    it('should return all registered agents metadata', () => {
      service.register(mockAgent);
      service.register(mockAgent2);

      const result = service.listAgents();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: 'research',
        name: 'Research Agent',
        description: 'Performs research tasks',
        tools: ['web_search', 'document_read'],
      });
      expect(result[1]).toEqual({
        type: 'coding',
        name: 'Coding Agent',
        description: 'Performs coding tasks',
        tools: ['code_edit', 'terminal'],
      });
    });

    it('should return empty array when no agents registered', () => {
      const result = service.listAgents();

      expect(result).toEqual([]);
    });
  });
});
