import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/language-context';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Munim Ji — AI Business Partner for Every Paytm Merchant',
  description: 'Voice-first AI business copilot for small merchants on Paytm. From digital payments to intelligent business growth.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0B1F4B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const paytmHost = process.env.NEXT_PUBLIC_PAYTM_HOST || 'https://securegw-stage.paytm.in';
  const paytmMid = process.env.NEXT_PUBLIC_PAYTM_MID || 'YOUR_STAGING_MID';

  return (
    <html lang="hi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Leaflet CSS for Map */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>

        {/* Paytm JS Checkout Loader for Sandbox Staging */}
        <Script
          src={`${paytmHost}/merchantpgpui/checkoutjs/merchants/${paytmMid}.js`}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

