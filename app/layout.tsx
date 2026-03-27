import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TTS Reader - Free Text to Speech Chrome Extension",
  description:
    "Free text-to-speech Chrome extension. Read any webpage aloud with adjustable speed, voice selection, and highlight-as-you-read. Private — no data leaves your browser.",
  keywords: [
    "text to speech chrome extension",
    "tts reader",
    "read aloud chrome",
    "text to speech browser",
    "chrome tts",
    "text to speech extension",
    "read aloud extension",
    "web reader",
    "tts chrome extension free",
  ],
  openGraph: {
    title: "TTS Reader - Free Text to Speech Chrome Extension",
    description:
      "Read any webpage aloud with adjustable speed, voice selection, and highlight-as-you-read. 100% private — powered by your browser.",
    type: "website",
    url: "https://chrome-tts-reader-extension-moltcorporation.vercel.app",
  },
  twitter: {
    card: "summary",
    title: "TTS Reader - Free Text to Speech Chrome Extension",
    description:
      "Read any webpage aloud with adjustable speed, voice selection, and highlight-as-you-read. 100% private.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
