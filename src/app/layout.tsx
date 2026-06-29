import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider, ThemeScript } from '@/components/theme'

export const metadata: Metadata = {
  title: 'My Tech Memoir',
  description: 'A technical memoir on networking — how the internet routes data, written as it was learned.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#0d1117' },
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
          backgroundColor: 'var(--bg-base)',
          color: 'var(--ink-primary)',
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
