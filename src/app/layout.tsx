import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider, ThemeScript } from '@/components/theme'
import SessionProvider from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/sonner'
import { Geist, Lora, JetBrains_Mono } from "next/font/google"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const lora = Lora({ subsets: ['latin'], variable: '--font-serif', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'My Tech Memoir',
    template: '%s | My Tech Memoir',
  },
  description: 'A personal blog about code, architecture, and the craft of building software.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://my-tech-memoir.vercel.app'),
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
    { media: '(prefers-color-scheme: light)', color: '#ebeae6' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable, lora.variable, jetbrainsMono.variable)} suppressHydrationWarning>
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
        <SessionProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
