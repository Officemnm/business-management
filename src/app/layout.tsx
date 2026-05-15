import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const banglaFont = localFont({
  src: "../fonts/BL_Shahid.ttf",
  variable: "--font-bangla",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  title: {
    default: "ভ্যারাইটিজ কসমেটিক্স",
    template: "%s | ভ্যারাইটিজ কসমেটিক্স",
  },
  description: "পেশাদার ব্যবসা ব্যবস্থাপনা প্ল্যাটফর্ম",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  applicationName: "ভ্যারাইটিজ কসমেটিক্স",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${banglaFont.variable} ${inter.variable}`}>
      <body className="antialiased">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#1c1917",
              border: "1px solid #d6d3d1",
              fontSize: "13px",
              borderRadius: "10px",
              padding: "10px 16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            },
            success: {
              iconTheme: { primary: "#66a80f", secondary: "#ffffff" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
