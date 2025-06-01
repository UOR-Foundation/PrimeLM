import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrimeLM Demo',
  description: 'A basic proof of concept implementation demonstrating PrimeLM\'s Prime Core in a conversational chatbot.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
