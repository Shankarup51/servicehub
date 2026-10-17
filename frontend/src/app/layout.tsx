
import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import Providers from "./providers";
import "./globals.css";
import { GlobalToaster } from "@/shared/ui/global-toaster";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ServiceHub",
  description: "Smart Service Marketplace and Booking Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={rajdhani.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${rajdhani.className} antialiased font-sans`}>
        <Providers>{children}
            <GlobalToaster />
        </Providers>
      </body>
    </html>
  );
}
