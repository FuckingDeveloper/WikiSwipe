import { PWARegister } from "@/components/pwa-register";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WikiSwipe",
  description: "Tinder-style discovery for Wikipedia with deliberate reading and voting.",
  manifest: "/manifest.webmanifest",
  applicationName: "WikiSwipe",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WikiSwipe"
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#050a13",
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
