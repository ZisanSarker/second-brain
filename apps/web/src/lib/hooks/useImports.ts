import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importsApi } from '@/lib/api/imports';

export function useWebsiteImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof importsApi.website>[0]) => importsApi.website(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useGitHubImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof importsApi.github>[0]) => importsApi.github(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useYouTubeImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof importsApi.youtube>[0]) => importsApi.youtube(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}
