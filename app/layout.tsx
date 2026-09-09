import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ChatProvider } from '@/context/ChatContext'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'ComCoach — Computer Troubleshooting Lab',
  description:
    'AI-powered classroom coach for the "กิจกรรมสำรวจอาการเสียของเครื่องคอมพิวเตอร์" lab activity. Helps students diagnose and troubleshoot computer hardware faults using the Socratic method.',
  keywords: 'computer troubleshooting, hardware diagnostics, classroom activity, AI coach, ComCoach',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-animated-gradient antialiased">
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  )
}
