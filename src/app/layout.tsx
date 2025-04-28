import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import "@/styles/hide-scrollbar.css";
import ToastProvider from "@/components/ui/ToastProvider";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "مدرسة الجيل الواعد الخاصة",
  description: "نظام إدارة مدرسي متكامل",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} font-cairo antialiased`}
        suppressHydrationWarning
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
