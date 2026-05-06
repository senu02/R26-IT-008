// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Geist, Geist_Mono } from 'next/font/google';
import '@/app/globals.css';
import { ThemeProvider } from '@/app/providers';
import Script from 'next/script';
import CookieConsent from '@/components/CookieConsent';

const inter = Inter({ subsets: ['latin'] });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PureTalk',
  description: 'Pure intention social platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${geistSans.variable} ${geistMono.variable} ${inter.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <CookieConsent />
          {children}
        </ThemeProvider>

        {/* Google Translate container (hidden) */}
        <div id="google_translate_element" style={{ display: 'none' }}></div>

        {/* Google Translate script */}
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script
          id="google-translate-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
              }
            `,
          }}
        />
      </body>
    </html>
  );
}