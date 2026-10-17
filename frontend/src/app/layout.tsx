
import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";
import { GlobalToaster } from "@/shared/ui/global-toaster";

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
    <html lang="en">
      <body>
        <Providers>{children}
            <GlobalToaster />
        </Providers>
      </body>
    </html>
  );
}
