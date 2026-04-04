import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sindoor",
  description: "Sindoor matrimonial web application",
};

import { AuthProvider } from "@/context/AuthProvider";
import { ModalProvider } from "@/context/ModalContext";
import GlobalModals from "@/components/GlobalModals";

// ... existing imports

import Navbar from "@/components/Navbar/Navbar";

// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <AuthProvider>
          <ModalProvider>
            <GlobalModals />
            <Navbar />
            {children}
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
