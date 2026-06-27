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
      className="group rounded-xl border border-border bg-popover/50 p-5 transition-all hover:border-border hover:bg-muted/50"
    >
      <div className={`mb-3 inline-flex rounded-lg p-2.5 ${color}`}>{icon}</div>
      <h3 className="font-semibold text-foreground group-hover:text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
