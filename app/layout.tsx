import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Gestão de Projetos',
  description: 'Sistema interno de gestão de projetos da Sheep Tech',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={manrope.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
