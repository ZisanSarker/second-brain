'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeStr = String(children).replace(/\n$/, '');

      if (match) {
        return (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.8rem' }}
          >
            {codeStr}
          </SyntaxHighlighter>
        );
      }

      return (
        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm text-purple-300" {...props}>
          {children}
        </code>
      );
    },
    pre({ children }) {
      return (
        <div className="my-3 rounded-lg overflow-hidden border border-slate-700/50">{children}</div>
      );
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto my-3">
          <table className="min-w-full border-collapse border border-slate-700/50 text-sm">
            {children}
          </table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th className="border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-left font-medium text-slate-300">
          {children}
        </th>
      );
    },
    td({ children }) {
      return <td className="border border-slate-700/50 px-3 py-2 text-slate-400">{children}</td>;
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 underline"
        >
          {children}
        </a>
      );
    },
    ul({ children }) {
      return <ul className="list-disc list-inside space-y-1 my-2 text-slate-300">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside space-y-1 my-2 text-slate-300">{children}</ol>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-2 border-purple-500/50 pl-4 my-2 text-slate-400 italic">
          {children}
        </blockquote>
      );
    },
  };

  return (
    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
