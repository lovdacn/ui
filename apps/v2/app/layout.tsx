import type { Metadata, Viewport } from "next"
import { Fraunces, Space_Grotesk, JetBrains_Mono } from "next/font/google"

import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { META_THEME_COLORS, siteConfig } from "@/lib/config"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
})

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - React Native & Expo UI Component Library`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [
    {
      name: siteConfig.name,
      url: siteConfig.url,
    },
  ],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "technology",
  classification: "React Native & Expo UI Components",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  keywords: [
    "React Native UI components",
    "shadcn for react native",
    "Expo UI components",
    "Tailwind CSS React Native",
    "NativeWind",
    "Uniwind",
    "shadcn React Native",
    "React Native design system",
    "Expo Router UI kit",
    "React Native primitives",
    "Mobile UI library",
    "Open Source React Native UI",
    "lovdaCN",
  ],
  alternates: {
    canonical: siteConfig.url,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: `${siteConfig.name} - React Native & Expo UI Toolkit`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - React Native & Expo UI Components`,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - React Native & Expo UI Toolkit`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@lvcn",
    site: "@lvcn",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "0BqCMBBzgG8M_tlZHw5mb_rf24UsBzpYTAF77_QHEns",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: META_THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: META_THEME_COLORS.dark },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
        sameAs: [siteConfig.links.github, siteConfig.links.twitter],
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: { "@id": `${siteConfig.url}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteConfig.url}/docs?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/#software`,
        name: siteConfig.name,
        operatingSystem: "iOS, Android, Web",
        applicationCategory: "DeveloperApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: siteConfig.description,
        url: siteConfig.url,
        author: { "@id": `${siteConfig.url}/#organization` },
      },
    ],
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${fraunces.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          // Applies the beta skin before first paint so the orange theme
          // survives navigation and reloads without flashing the default theme.
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("lovdacn-beta")==="1"){document.documentElement.classList.add("beta")}}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
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
            <Analytics />
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

