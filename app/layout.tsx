import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MTAA AFRIQ — Civilization Scale Operating System",
  description:
    "Africa’s digital operating system for communication, governance, economy, identity, logistics, and infrastructure.",

  keywords: [
    "Africa",
    "Operating System",
    "Digital Nation",
    "GovTech",
    "FinTech",
    "Smart Cities",
    "MTAA",
  ],

  openGraph: {
    title: "MTAA AFRIQ",
    description:
      "Africa’s unified digital operating system.",
    url: "https://mtaa-os-8eqp47lsb-imali-tech-ltd.vercel.app",
    siteName: "MTAA AFRIQ",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "MTAA AFRIQ",
    description:
      "Africa’s civilization-scale operating system.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
