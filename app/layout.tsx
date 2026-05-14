import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
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
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>{children}</body>
    </html>
  );
}
