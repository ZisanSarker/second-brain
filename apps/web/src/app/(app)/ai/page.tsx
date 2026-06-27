'use client';

import { AiPageLayout, AiNav } from '@/components/ai/AiLayout';
import { FeatureCard } from '@/components/ai/FeatureCard';
import {
  FileText,
  Layers,
  HelpCircle,
  BookOpen,
  GitBranch,
  Columns,
  Languages,
  GraduationCap,
  BarChart3,
  FileCode,
  ListChecks,
} from 'lucide-react';

const features = [
  {
    href: '/ai/summary',
    title: 'Summary',
    description: 'Generate concise summaries in multiple styles',
    icon: <FileText size={20} />,
    color: 'bg-blue-500/10 text-blue-400',
  },
  {
    href: '/ai/flashcards',
    title: 'Flashcards',
    description: 'Create study flashcards from your content',
    icon: <Layers size={20} />,
    color: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    href: '/ai/quiz',
    title: 'Quiz',
    description: 'Generate multiple choice quizzes',
    icon: <HelpCircle size={20} />,
    color: 'bg-amber-500/10 text-amber-400',
  },
  {
    href: '/ai/notes',
    title: 'AI Notes',
    description: 'Transform content into structured notes',
    icon: <BookOpen size={20} />,
    color: 'bg-violet-500/10 text-violet-400',
  },
  {
    href: '/ai/mindmap',
    title: 'Mind Map',
    description: 'Visualize content hierarchy and relationships',
    icon: <GitBranch size={20} />,
    color: 'bg-rose-500/10 text-rose-400',
  },
  {
    href: '/ai/comparison',
    title: 'Comparison',
    description: 'Compare and contrast multiple documents',
    icon: <Columns size={20} />,
    color: 'bg-cyan-500/10 text-cyan-400',
  },
  {
    href: '/ai/translation',
    title: 'Translation',
    description: 'Translate content to different languages',
    icon: <Languages size={20} />,
    color: 'bg-indigo-500/10 text-indigo-400',
  },
  {
    href: '/ai/learning',
    title: 'Learning Tools',
    description: 'Takeaways, glossary, FAQ, study plans, timeline',
    icon: <GraduationCap size={20} />,
    color: 'bg-orange-500/10 text-orange-400',
  },
  {
    href: '/ai/insights',
    title: 'Insights',
    description: 'Cross-document analysis and workspace trends',
    icon: <BarChart3 size={20} />,
    color: 'bg-pink-500/10 text-pink-400',
  },
  {
    href: '/ai/templates',
    title: 'Templates',
    description: 'Customize AI prompt templates',
    icon: <FileCode size={20} />,
    color: 'bg-teal-500/10 text-teal-400',
  },
  {
    href: '/ai/tasks',
    title: 'Tasks',
    description: 'Monitor background generation jobs',
    icon: <ListChecks size={20} />,
    color: 'bg-zinc-500/10 text-zinc-400',
  },
];

export default function AiHubPage() {
  return (
    <AiPageLayout
      title="AI Knowledge Intelligence"
      description="Generate study materials, summaries, and insights from your documents"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <FeatureCard key={f.href} {...f} />
        ))}
      </div>
    </AiPageLayout>
  );
}
