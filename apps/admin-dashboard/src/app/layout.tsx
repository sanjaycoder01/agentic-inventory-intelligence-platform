import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Antigravity Inventory Platform',
  description: 'AI-Powered Intelligent Inventory Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 dark:bg-zinc-950">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
