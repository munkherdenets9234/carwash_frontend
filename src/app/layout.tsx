import type { Metadata, Viewport } from "next";

import { Toaster } from "sonner";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Car Wash",
  description: "Booking, shifts and the day's takings for a car wash business.",
};

export const viewport: Viewport = {
  // The employee and customer surfaces are used one-handed on a phone.
  // maximumScale is deliberately left alone: pinning it would stop anyone who
  // needs to zoom from doing so, which is a real accessibility failure and
  // buys nothing but a slightly tidier tap response.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts from Google, self-declared rather than via next/font so the
            same two families are used by the wireframes and this app without
            a build step between them. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
