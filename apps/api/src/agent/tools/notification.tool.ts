import { Injectable } from '@nestjs/common';
import { BaseTool, ToolResult } from './base-tool';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class NotificationTool extends BaseTool {
  readonly name = 'notify';
  readonly description = 'Send a notification to a user';
  readonly inputSchema = {
    userId: { type: 'string', description: 'User ID to notify' },
    title: { type: 'string' },
    body: { type: 'string' },
  };
  readonly outputSchema = { sent: { type: 'boolean' } };
  readonly minRole = 'ADMIN';

  constructor(private notifService: NotificationsService) {
    super();
  }

  async execute(workspaceId: string, userId: string, input: any): Promise<ToolResult> {
    try {
      await this.notifService.create({
        workspaceId,
        userId: input.userId,
        type: 'AI_TASK_COMPLETED',
        title: input.title,
        body: input.body,
      });
      return { success: true, output: { sent: true } };
    } catch (e: any) {
      return { success: false, output: null, error: e.message };
    }
  }
}
