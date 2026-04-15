import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import CookieConsent from "@/components/compliance/CookieConsent";
import PostHogProvider from "@/components/providers/PostHogProvider";
import SentryLogger from "@/components/providers/SentryLogger";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nextround.ai"),
  title: {
    default: "NextRound - AI Powered Resume Builder",
    template: "%s | NextRound"
  },
  description: "Create ATS-friendly resumes in seconds. Use AI to tailor your resume for any job description. Free for everyone.",
  keywords: ["resume builder", "AI resume", "career tools", "job application", "ATS friendly", "resume tailoring", "NextRound"],
  authors: [{ name: "NextRound Team" }],
  creator: "NextRound",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nextround.ai",
    title: "NextRound - AI Powered Resume Builder",
    description: "Create ATS-friendly resumes in seconds. Use AI to tailor your resume for any job description.",
    siteName: "NextRound",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NextRound Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextRound - AI Powered Resume Builder",
    description: "Create ATS-friendly resumes in seconds. Use AI to tailor your resume for any job description.",
    images: ["/og-image.png"],
    creator: "@nextround",
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <PostHogProvider>
            {children}
            <CookieConsent />
            <Toaster theme="dark" position="top-center" richColors />
            <SentryLogger />
            <Script
              id="razorpay-checkout-js"
              src="https://checkout.razorpay.com/v1/checkout.js"
              strategy="afterInteractive"
            />
          </PostHogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
