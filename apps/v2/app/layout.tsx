import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { META_THEME_COLORS, siteConfig } from "@/lib/config"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div
            data-slot="layout"
            className="group/layout relative z-10 flex min-h-svh flex-col bg-background"
          >
            <SiteHeader />
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
