import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ui/sw-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://startupvo1.vercel.app";

export const metadata: Metadata = {
  title: "AgentFlow — The CRM for agents who hate CRMs",
  description:
    "Dead-simple contact management and follow-up for solo real estate agents. No automations. No dashboards. Just who to call today.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgentFlow",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "AgentFlow",
    description: "Dead-simple CRM for solo real estate agents. Track leads, manage pipelines, and never miss a follow-up.",
    type: "website",
    siteName: "AgentFlow",
    url: appUrl,
    images: [
      {
        url: `${appUrl}/icons/icon-512.png`,
        width: 512,
        height: 512,
        alt: "AgentFlow — CRM for real estate agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentFlow",
    description: "Dead-simple CRM for solo real estate agents. Track leads, manage pipelines, and never miss a follow-up.",
    images: [`${appUrl}/icons/icon-512.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0F766E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-body antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
