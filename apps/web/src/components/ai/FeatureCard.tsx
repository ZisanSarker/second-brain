import Link from 'next/link';
import { ReactNode } from 'react';

interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
}

export function FeatureCard({ href, title, description, icon, color }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
    >
      <div className={`mb-3 inline-flex rounded-lg p-2.5 ${color}`}>{icon}</div>
      <h3 className="font-semibold text-zinc-100 group-hover:text-white">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </Link>
  );
}
