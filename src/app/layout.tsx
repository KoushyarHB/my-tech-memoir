import type { Metadata } from 'next'
import './globals.css'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Networking Masterclass',
  description: 'The Complete Networking Masterclass - Learn how the internet routes data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-200 transition-colors">
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}
