import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/** Latin variable files from the same Google Fonts cuts previously loaded at build time. */
const fraunces = localFont({
  src: "./fonts/Fraunces-latin.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const inter = localFont({
  src: "./fonts/Inter-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2A2826",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  ),
  title: "Future You Mirror",
  description:
    "See the skin you'll have — and the one you could. One selfie. Two minutes.",
  openGraph: {
    type: "website",
    siteName: "Future You Mirror",
    title: "Future You Mirror",
    description:
      "See the skin you'll have — and the one you could. One selfie. Two minutes.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Future You Mirror",
    description:
      "See the skin you'll have — and the one you could. One selfie. Two minutes.",
  },
  applicationName: "Future You Mirror",
  appleWebApp: {
    capable: true,
    title: "Future You Mirror",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
