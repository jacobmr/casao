import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Navigation } from "@/components/navigation"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Casa Vistas at Mar Vista | Luxury Ocean-View Rental in Brasilito, Costa Rica",
  description:
    "Experience paradise at Casa Vistas, a stunning luxury vacation rental in Brasilito, Costa Rica with breathtaking ocean views, private infinity pool, and world-class amenities. Book your dream getaway today.",
  keywords: ["Costa Rica vacation rental", "Brasilito luxury villa", "ocean view rental", "infinity pool", "Guanacaste", "Mar Vista"],
  authors: [{ name: "Casa Vistas" }],
  creator: "Casa Vistas",
  publisher: "Casa Vistas",
  metadataBase: new URL('https://www.casavistas.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Casa Vistas at Mar Vista | Luxury Ocean-View Rental",
    description: "Experience paradise at Casa Vistas with breathtaking ocean views, private infinity pool, and world-class amenities in Brasilito, Costa Rica.",
    url: 'https://www.casavistas.net',
    siteName: 'Casa Vistas',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Casa Vistas at Mar Vista | Luxury Ocean-View Rental",
    description: "Experience paradise at Casa Vistas with breathtaking ocean views and private infinity pool in Costa Rica.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Navigation />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
