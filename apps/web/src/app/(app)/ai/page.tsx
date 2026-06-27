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
    color: 'bg-info/10 text-info',
  },
  {
    href: '/ai/flashcards',
    title: 'Flashcards',
    description: 'Create study flashcards from your content',
    icon: <Layers size={20} />,
    color: 'bg-success/10 text-success',
  },
  {
    href: '/ai/quiz',
    title: 'Quiz',
    description: 'Generate multiple choice quizzes',
    icon: <HelpCircle size={20} />,
    color: 'bg-warning/10 text-warning',
  },
  {
    href: '/ai/notes',
    title: 'AI Notes',
    description: 'Transform content into structured notes',
    icon: <BookOpen size={20} />,
    color: 'bg-primary/10 text-primary',
  },
  {
    href: '/ai/mindmap',
    title: 'Mind Map',
    description: 'Visualize content hierarchy and relationships',
    icon: <GitBranch size={20} />,
    color: 'bg-destructive/10 text-destructive-foreground',
  },
  {
    href: '/ai/comparison',
    title: 'Comparison',
    description: 'Compare and contrast multiple documents',
    icon: <Columns size={20} />,
    color: 'bg-info/10 text-info',
  },
  {
    href: '/ai/translation',
    title: 'Translation',
    description: 'Translate content to different languages',
    icon: <Languages size={20} />,
    color: 'bg-primary/10 text-primary',
  },
  {
    href: '/ai/learning',
    title: 'Learning Tools',
    description: 'Takeaways, glossary, FAQ, study plans, timeline',
    icon: <GraduationCap size={20} />,
    color: 'bg-warning/10 text-warning',
  },
  {
    href: '/ai/insights',
    title: 'Insights',
    description: 'Cross-document analysis and workspace trends',
    icon: <BarChart3 size={20} />,
    color: 'bg-primary/10 text-primary',
  },
  {
    href: '/ai/templates',
    title: 'Templates',
    description: 'Customize AI prompt templates',
    icon: <FileCode size={20} />,
    color: 'bg-secondary/10 text-secondary',
  },
  {
    href: '/ai/tasks',
    title: 'Tasks',
    description: 'Monitor background generation jobs',
    icon: <ListChecks size={20} />,
    color: 'bg-muted/10 text-muted-foreground',
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
