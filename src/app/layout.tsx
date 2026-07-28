import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider, ThemeScript } from '@/components/theme'

export const metadata: Metadata = {
  title: {
    default: 'My Tech Memoir',
    template: '%s | My Tech Memoir',
  },
  description: 'A personal blog about code, architecture, and the craft of building software.',
  metadataBase: new URL('https://my-tech-memoir.vercel.app'),
  openGraph: {
    title: 'My Tech Memoir',
    description: 'A personal blog about code, architecture, and the craft of building software.',
    type: 'website',
    locale: 'en_US',
    siteName: 'My Tech Memoir',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Tech Memoir',
    description: 'A personal blog about code, architecture, and the craft of building software.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className="min-h-screen flex flex-col transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <ThemeProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
