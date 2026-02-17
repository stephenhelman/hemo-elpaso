import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import SiteLayout from "@/components/layout/SiteLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hemophilia Outreach of El Paso",
    template: "%s | Hemophilia Outreach of El Paso",
  },
  description:
    "Supporting individuals and families affected by bleeding disorders in the El Paso community.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}
