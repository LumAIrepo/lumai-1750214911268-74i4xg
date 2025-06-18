```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/wallet-provider'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StreamFlow Clone - Token Streaming & Vesting Platform',
  description: 'Create and manage token streams, vesting schedules, and payment flows on Solana',
  keywords: ['solana', 'defi', 'token streaming', 'vesting', 'payments', 'crypto'],
  authors: [{ name: 'StreamFlow Clone' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0f172a',
  openGraph: {
    title: 'StreamFlow Clone - Token Streaming & Vesting Platform',
    description: 'Create and manage token streams, vesting schedules, and payment flows on Solana',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamFlow Clone - Token Streaming & Vesting Platform',
    description: 'Create and manage token streams, vesting schedules, and payment flows on Solana',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-900 text-slate-100 antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <WalletProvider>
            <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/50 to-slate-900"></div>
              <div className="relative z-10">
                {children}
              </div>
            </div>
            <Toaster />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```