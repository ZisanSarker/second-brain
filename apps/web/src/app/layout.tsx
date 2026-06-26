import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Second Brain - Intelligent Workspace',
  description: 'Organize your knowledge base, chat with documents, and automate workflows with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} grid-bg min-h-screen text-slate-100`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
