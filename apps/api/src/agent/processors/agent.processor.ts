import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AgentService } from '../agent.service';

@Processor('agents')
export class AgentProcessor extends WorkerHost {
  private logger = new Logger(AgentProcessor.name);

  constructor(private agentService: AgentService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing agent job ${job.id}: ${job.data.type}`);

    try {
      const result = await this.agentService.runAgent(job.data);
      return result;
    } catch (e: any) {
      this.logger.error(`Agent job ${job.id} failed: ${e.message}`);
      throw e;
    }
  }
}
