import Footer from '@/components/ui/footer';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Cranberri Diamonds',
  description: 'Discover our collection of exquisite diamonds and luxury jewelry at Cranberri Diamonds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-serif`}>
        {children}
        <Footer/>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}