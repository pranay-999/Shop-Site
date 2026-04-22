import type { Metadata } from 'next'
import type React from 'react'
import { Analytics } from '@vercel/analytics/next'
import { CategoryProvider } from '@/context/CategoryContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'StockFlow',
  description: 'Tiles & Sanitary Inventory Management System',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <CategoryProvider>
          {children}
        </CategoryProvider>
        <Analytics />
      </body>
    </html>
  )
}
