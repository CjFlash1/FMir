import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({
  subsets: ["latin", "cyrillic"], // Added cyrillic for Ukrainian support
  variable: "--font-inter",
});

import { prisma } from "@/lib/prisma";

export async function generateMetadata() {
  const siteName = await prisma.setting.findUnique({ where: { key: 'site_name' } });
  return {
    title: siteName?.value || "Fujimir | Online Photo Printing",
    description: "Professional photo printing service in Ukraine. High quality prints, fast delivery.",
  };
}

import { TranslationProvider } from "@/lib/i18n";
import { SettingsProvider } from "@/lib/settings-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <SettingsProvider>
          <TranslationProvider>
            <Navbar />
            {children}
            <Footer />
          </TranslationProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
