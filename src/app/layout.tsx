import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientLayoutWrapper } from "@/components/client-layout-wrapper";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Flowstate - Focus AI | Neuroadaptive Focus Coach',
  description: 'A web application that uses EEG data from the Muse 2 headset to detect when students are losing focus during study sessions and provides gentle, real-time alerts to refocus.',
  keywords: ['EEG', 'focus', 'productivity', 'Muse headset', 'neurofeedback', 'study', 'concentration'],
  authors: [{ name: 'AJ' }],
  openGraph: {
    title: 'Flowstate - Focus AI',
    description: 'Neuroadaptive Focus Coach - Real-time focus detection using EEG data from Muse 2 headset',
    url: baseUrl,
    siteName: 'Flowstate',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Flowstate - Focus AI',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flowstate - Focus AI',
    description: 'Neuroadaptive Focus Coach - Real-time focus detection using EEG data',
    images: [`${baseUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}