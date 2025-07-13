
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import { Inter } from "next/font/google";
import { SceneProvider } from "@/contexts/SceneContext";

export const metadata: Metadata = {
  title: "Layered Canvas",
  description: "A creative drawing and layering application.",
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <SceneProvider>
            <Header />
            <div className="pt-16">
              <main>{children}</main>
            </div>
            <Toaster />
        </SceneProvider>
      </body>
    </html>
  );
}
