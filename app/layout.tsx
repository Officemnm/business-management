import type { Metadata } from "next";
import { kalpurush } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "লগইন - ভ্যারাইটিজ কসমেটিক্স",
  description: "লগইন পেইজ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${kalpurush.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
