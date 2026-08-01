import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-helvetica",
  display: "swap",
});

export const metadata: Metadata = {
  title: "atom - autonomous AI cybersecurity",
  description:
    "atom is an AI-driven cybersecurity platform that detects, analyzes, and responds to threats in real time using intelligent agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-black text-cool-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
