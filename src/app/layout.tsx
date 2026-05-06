import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { PWARegister } from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: "Editorial Calendar — SKOOL Funnel",
  description:
    "Calendrier éditorial Instagram avec stratégie funnel d'acquisition vers SKOOL. 8 semaines de planning, notifications, templates et analytics.",
  manifest: "/manifest.webmanifest",
  applicationName: "Editorial Calendar",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Editorial",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png?v=2", sizes: "16x16" },
      { url: "/favicon-32.png?v=2", sizes: "32x32" },
      { url: "/icons/icon-192.png?v=2", sizes: "192x192" },
      { url: "/icons/icon-512.png?v=2", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180" }],
  },
  openGraph: {
    title: "Editorial Calendar — SKOOL Funnel",
    description: "Calendrier éditorial Instagram avec stratégie funnel d'acquisition vers SKOOL.",
    images: ["/og-image.png"],
    type: "website",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0a14" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased min-h-svh bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" theme="system" />
          <PWARegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
