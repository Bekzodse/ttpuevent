import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { I18nProvider } from "@/components/I18nProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import { ThemeAndBrandingProvider } from "@/components/ThemeAndBrandingProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Turin Polytechnic University in Tashkent — Event & Hall Portal",
  description:
    "Official event hall calendar, equipment reservation, booking applications, and campus portal for Turin Polytechnic University in Tashkent.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <I18nProvider>
          <ThemeAndBrandingProvider>
            <AuthProvider>
              <NotificationProvider>
                <Navbar />
                <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                  {children}
                </main>
                <Footer />
              </NotificationProvider>
            </AuthProvider>
          </ThemeAndBrandingProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
