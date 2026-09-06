import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from '@/components/ui/toast';


export const metadata: Metadata = {
  title: 'BVA | Capital One High Priority',
  description: 'Bank Voice Admin — Notation Builder for High Priority associates',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans antialiased">{children}</body>
      <Toaster />
    </html>
  );
}
