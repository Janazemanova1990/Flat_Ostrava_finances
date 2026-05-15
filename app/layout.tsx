import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Flat Finance Tracker",
  description: "Track finances for Nádražní 2965/9, Ostrava",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className={`${dmSans.variable} ${playfairDisplay.variable}`}>{children}</body>
    </html>
  );
}
