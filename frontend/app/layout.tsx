import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { Header } from "@/components/Header";
import { TestnetBanner } from "@/components/TestnetBanner";
import { NetworkGuard } from "@/components/NetworkGuard";

export const metadata: Metadata = {
  title: "GlubClub — testnet scaffold",
  description: "Scaffold build. Not final copy. Testnet only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">
        <Web3Provider>
          <TestnetBanner />
          <NetworkGuard />
          <Header />
          <main>{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}
