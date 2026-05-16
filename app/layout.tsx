import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BrandFlow — Smart Social Business Platform',
  description:
    'BrandFlow helps you manage social media, analytics, campaigns, CRM, and AI-powered insights from one unified dashboard.',
  keywords: ['social media', 'marketing', 'analytics', 'CRM', 'campaigns', 'AI'],
  authors: [{ name: 'BrandFlow' }],
  openGraph: {
    title: 'BrandFlow',
    description: 'Grow your brand smarter with BrandFlow',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
