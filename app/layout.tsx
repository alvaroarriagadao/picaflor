import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Outfit, JetBrains_Mono } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Picaflor · Técnica diaria de guitarra",
  description:
    "Un lick o ejercicio de técnica cada día. Metrónomo integrado, biblioteca de ejercicios y seguimiento de tu racha. Para guitarristas que quieren mejorar de verdad.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Picaflor",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Picaflor · Técnica diaria de guitarra",
    description:
      "Un lick o ejercicio de técnica cada día. Metrónomo integrado, biblioteca de ejercicios y seguimiento de tu racha.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0c0a09",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="font-body antialiased">
        <div className="relative z-10">{children}</div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
