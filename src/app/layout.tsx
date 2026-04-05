import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'License System',
  description: 'License key management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        {children}
      </body>
    </html>
  )
}