import type { Metadata, Viewport } from "next";
import { Fredoka, Noto_Sans } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexProvider";

const fredoka = Fredoka({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  weight: ["400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Nacrtaj i Pogodi | Multiplayer Igra Crtanja",
  description: "Zabavna multiplayer igra crtanja i pogađanja sa prijateljima. Pridruži se ili kreiraj igru!",
  keywords: ["igra", "crtanje", "multiplayer", "zabava", "prijatelji"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f6ead2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bs">
      <body className={`${fredoka.variable} ${notoSans.variable} font-sans antialiased`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
