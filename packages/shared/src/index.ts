import { User } from '@second-brain/types';

export function formatDisplayName(user: User): string {
  return user.name || user.email.split('@')[0];
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
