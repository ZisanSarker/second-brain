import apiClient from './client';

export interface Agent {
  type: string;
  name: string;
  description: string;
  tools: string[];
}

export interface AgentExecution {
  id: string;
  workspaceId: string;
  agentId?: string;
  userId?: string;
  type: string;
  status: string;
  input: any;
  output?: any;
  plan?: any;
  error?: string;
  tokenUsage?: any;
  steps?: AgentExecutionStep[];
  approvals?: any[];
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AgentExecutionStep {
  id: string;
  executionId: string;
  stepIndex: number;
  type: string;
  toolName?: string;
  toolInput?: any;
  toolOutput?: any;
  status: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Workflow {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  steps: any[];
  trigger: any;
  isActive: boolean;
  createdAt: string;
}

export interface Approval {
  id: string;
  workspaceId: string;
  executionId?: string;
  action: string;
  status: string;
  context: any;
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface AgentSchedule {
  id: string;
  workspaceId: string;
  name: string;
  cron: string;
  agentId?: string;
  workflowId?: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
}

export const agentsApi = {
  list: () => apiClient.get<Agent[]>('/agents').then((r) => r.data),

  run: (data: { type: string; input?: string; context?: any; model?: string }) =>
    apiClient.post('/agents/run', data).then((r) => r.data),

  listExecutions: (params?: { status?: string; limit?: number }) =>
    apiClient.get('/agents/executions', { params }).then((r) => r.data),

  getExecution: (id: string) =>
    apiClient.get<AgentExecution>(`/agents/executions/${id}`).then((r) => r.data),

  cancelExecution: (id: string) =>
    apiClient.post(`/agents/executions/${id}/cancel`).then((r) => r.data),

  retryExecution: (id: string) =>
    apiClient.post(`/agents/executions/${id}/retry`).then((r) => r.data),

  listTools: () => apiClient.get('/agents/tools').then((r) => r.data),

  listWorkflows: () => apiClient.get<Workflow[]>('/agents/workflows').then((r) => r.data),

  getWorkflow: (id: string) =>
    apiClient.get<Workflow>(`/agents/workflows/${id}`).then((r) => r.data),

  createWorkflow: (data: { name: string; description?: string; steps?: any[] }) =>
    apiClient.post('/agents/workflows', data).then((r) => r.data),

  updateWorkflow: (id: string, data: any) =>
    apiClient.put(`/agents/workflows/${id}`, data).then((r) => r.data),

  deleteWorkflow: (id: string) => apiClient.delete(`/agents/workflows/${id}`).then((r) => r.data),

  runWorkflow: (id: string, input?: any) =>
    apiClient.post(`/agents/workflows/${id}/run`, { input }).then((r) => r.data),

  listApprovals: () => apiClient.get<Approval[]>('/agents/approvals').then((r) => r.data),

  approve: (id: string) => apiClient.post(`/agents/approvals/${id}/approve`).then((r) => r.data),

  reject: (id: string) => apiClient.post(`/agents/approvals/${id}/reject`).then((r) => r.data),

  modify: (id: string, modification: any) =>
    apiClient.post(`/agents/approvals/${id}/modify`, { modification }).then((r) => r.data),

  listSchedules: () => apiClient.get<AgentSchedule[]>('/agents/schedules').then((r) => r.data),

  createSchedule: (data: { name: string; cron: string; agentId?: string; workflowId?: string }) =>
    apiClient.post('/agents/schedules', data).then((r) => r.data),

  updateSchedule: (id: string, data: any) =>
    apiClient.put(`/agents/schedules/${id}`, data).then((r) => r.data),

  deleteSchedule: (id: string) => apiClient.delete(`/agents/schedules/${id}`).then((r) => r.data),
};
