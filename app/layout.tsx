import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  weight: "variable",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
});

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
