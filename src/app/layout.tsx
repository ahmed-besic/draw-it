import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexProvider";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nacrtaj i Pogodi | Multiplayer Igra Crtanja",
  description:
    "Zabavna multiplayer igra crtanja i pogađanja sa prijateljima. Pridruži se ili kreiraj igru!",
  keywords: ["igra", "crtanje", "multiplayer", "zabava", "prijatelji"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bs">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
