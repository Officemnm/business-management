import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const kalpurush = localFont({
  src: "../fonts/kalpurush.ttf",
  variable: "--font-kalpurush",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ভ্যারাইটিজ কসমেটিক্স — ব্যবসা ব্যবস্থাপনা",
  description: "পেশাদার ব্যবসা ব্যবস্থাপনা প্ল্যাটফর্ম",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={kalpurush.variable}>
      <body className={`${kalpurush.className} antialiased`}>
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
