import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api/agents';

export function useAgents() {
  return useQuery({ queryKey: ['agents'], queryFn: () => agentsApi.list() });
}

export function useRunAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; input?: string; context?: any }) => agentsApi.run(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-executions'] });
    },
  });
}

export function useAgentExecutions(params?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: ['agent-executions', params],
    queryFn: () => agentsApi.listExecutions(params),
  });
}

export function useAgentExecution(id: string) {
  return useQuery({
    queryKey: ['agent-execution', id],
    queryFn: () => agentsApi.getExecution(id),
    enabled: !!id,
  });
}

export function useCancelExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.cancelExecution(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-executions'] });
    },
  });
}

export function useRetryExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.retryExecution(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-executions'] });
    },
  });
}

export function useAgentTools() {
  return useQuery({ queryKey: ['agent-tools'], queryFn: () => agentsApi.listTools() });
}

export function useWorkflows() {
  return useQuery({ queryKey: ['workflows'], queryFn: () => agentsApi.listWorkflows() });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => agentsApi.getWorkflow(id),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; steps?: any[] }) =>
      agentsApi.createWorkflow(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.deleteWorkflow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useRunWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: any }) => agentsApi.runWorkflow(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-executions'] });
    },
  });
}

export function useApprovals() {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: () => agentsApi.listApprovals(),
    refetchInterval: 15000,
  });
}

export function useApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useSchedules() {
  return useQuery({ queryKey: ['schedules'], queryFn: () => agentsApi.listSchedules() });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; cron: string; agentId?: string }) =>
      agentsApi.createSchedule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}
