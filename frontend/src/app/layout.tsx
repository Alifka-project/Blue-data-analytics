import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cleanon Analytics - Grease Trap Recycling Dashboard",
  description: "Enterprise-grade analytics dashboard for Cleanon grease trap recycling facility. Predict missed cleanings, optimize routes, and drive operational efficiency.",
  keywords: ["analytics", "grease trap", "recycling", "UAE", "Cleanon", "dashboard", "ML", "prediction"],
  authors: [{ name: "Cleanon Analytics Team" }],
  creator: "Cleanon Analytics",
  publisher: "Cleanon",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://cleanon-analytics.vercel.app"),
  openGraph: {
    title: "Cleanon Analytics Dashboard",
    description: "Professional analytics dashboard for grease trap recycling operations",
    url: "https://cleanon-analytics.vercel.app",
    siteName: "Cleanon Analytics",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cleanon Analytics Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cleanon Analytics Dashboard",
    description: "Professional analytics dashboard for grease trap recycling operations",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#1e3a8a" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
