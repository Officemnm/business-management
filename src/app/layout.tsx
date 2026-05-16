import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const banglaFont = localFont({
  src: "../fonts/kalpurush.ttf",
  variable: "--font-bangla",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

const englishFont = localFont({
  src: "../fonts/BL_Shahid.ttf",
  variable: "--font-english",
  display: "swap",
  preload: true,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0000-007F, U+0080-00FF, U+0100-017F, U+0180-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
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
    <html lang="bn" className={`${englishFont.variable} ${banglaFont.variable} ${inter.variable}`}>
      <body className="antialiased">
        <SplashScreen />
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
