'use client';

import { useState } from 'react';
import { AiPageLayout } from '@/components/ai/AiLayout';
import { GenerateForm } from '@/components/ai/GenerateForm';
import { ContentList } from '@/components/ai/ContentCard';
import {
  useGenerateTakeaways,
  useGenerateGlossary,
  useGenerateFAQ,
  useGenerateStudyPlan,
  useGenerateInterviewQuestions,
  useGenerateTimeline,
} from '@/lib/hooks/useAi';

const tools = [
  { key: 'takeaways', label: 'Key Takeaways', description: 'Extract key points from content' },
  { key: 'glossary', label: 'Glossary', description: 'Build a glossary of important terms' },
  { key: 'faq', label: 'FAQ', description: 'Generate frequently asked questions' },
  { key: 'study-plan', label: 'Study Plan', description: 'Create a structured study plan' },
  {
    key: 'interview-questions',
    label: 'Interview Questions',
    description: 'Generate interview-style questions',
  },
  { key: 'timeline', label: 'Timeline', description: 'Create chronological timelines' },
];

export default function LearningPage() {
  const [activeTool, setActiveTool] = useState('takeaways');

  const generateTakeaways = useGenerateTakeaways();
  const generateGlossary = useGenerateGlossary();
  const generateFAQ = useGenerateFAQ();
  const generateStudyPlan = useGenerateStudyPlan();
  const generateInterviewQuestions = useGenerateInterviewQuestions();
  const generateTimeline = useGenerateTimeline();

  const mutations: Record<string, any> = {
    takeaways: generateTakeaways,
    glossary: generateGlossary,
    faq: generateFAQ,
    'study-plan': generateStudyPlan,
    'interview-questions': generateInterviewQuestions,
    timeline: generateTimeline,
  };

  const current = mutations[activeTool];

  return (
    <AiPageLayout title="Learning Tools" description="Study aids generated from your content">
      <div className="mb-6 flex flex-wrap gap-2">
        {tools.map((tool) => (
          <button
            key={tool.key}
            onClick={() => setActiveTool(tool.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTool === tool.key
                ? 'bg-primary text-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {tools.find((t) => t.key === activeTool)?.description}
      </p>

      <GenerateForm
        onGenerate={(data) => current.mutate(data)}
        isLoading={current.isPending}
        key={activeTool}
      />
    </AiPageLayout>
  );
}
