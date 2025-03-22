import React from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Prism from "prismjs";

// Import CSS files
import "./globals.css";
import "./markdown.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fanout - AI-powered Communication",
  description: "Connect and collaborate with AI assistance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
} 