import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rail Logistics Control Plane',
  description: 'Enterprise freight rail operations platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen">{children}</body>
    </html>
  )
}
