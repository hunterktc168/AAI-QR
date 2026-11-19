import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QR Studio',
  description:
    'Precision QR payload encoding, WCAG contrast verification, and styling studio.',
  openGraph: {
    title: 'QR Studio',
    description:
      'Precision QR payload encoding, WCAG contrast verification, and styling studio.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Studio',
    description:
      'Precision QR payload encoding, WCAG contrast verification, and styling studio.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-studio-grid font-sans text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-100"
      >
        {children}
      </body>
    </html>
  );
}
