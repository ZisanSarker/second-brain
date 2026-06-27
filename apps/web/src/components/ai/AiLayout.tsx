import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/ai', label: 'All Tools', icon: 'Sparkles' },
  { href: '/ai/summary', label: 'Summary', icon: 'FileText' },
  { href: '/ai/flashcards', label: 'Flashcards', icon: 'Layers' },
  { href: '/ai/quiz', label: 'Quiz', icon: 'HelpCircle' },
  { href: '/ai/notes', label: 'AI Notes', icon: 'BookOpen' },
  { href: '/ai/mindmap', label: 'Mind Map', icon: 'GitBranch' },
  { href: '/ai/comparison', label: 'Comparison', icon: 'Columns' },
  { href: '/ai/translation', label: 'Translation', icon: 'Languages' },
  { href: '/ai/learning', label: 'Learning', icon: 'GraduationCap' },
  { href: '/ai/insights', label: 'Insights', icon: 'BarChart3' },
  { href: '/ai/templates', label: 'Templates', icon: 'FileCode' },
  { href: '/ai/tasks', label: 'Tasks', icon: 'ListChecks' },
];

export function AiNav({ className }: { className?: string }) {
  return (
    <nav className={cn('flex flex-wrap gap-2', className)}>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function AiPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      </div>
      <AiNav />
      <div className="min-h-[300px]">{children}</div>
    </div>
  );
}
