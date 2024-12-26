import { type Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { ClientProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube Live Poll",
  description: "Real-time polling for YouTube live streams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
