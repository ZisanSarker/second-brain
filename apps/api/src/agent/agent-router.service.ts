import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BaseAgent } from './agents/base-agent';

@Injectable()
export class AgentRouterService implements OnModuleInit {
  private agents = new Map<string, BaseAgent>();

  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {}

  register(agent: BaseAgent) {
    this.agents.set(agent.type, agent);
  }

  getAgent(type: string): BaseAgent {
    const agent = this.agents.get(type);
    if (!agent) throw new Error(`Unknown agent type: ${type}`);
    return agent;
  }

  listAgents(): { type: string; name: string; description: string; tools: string[] }[] {
    return Array.from(this.agents.values()).map((a) => ({
      type: a.type,
      name: a.name,
      description: a.description,
      tools: a.defaultTools,
    }));
  }
}
