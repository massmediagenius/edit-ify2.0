import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Edit-ify",
  description: "Video editor freelance platform — submit edits, track earnings, and access assets.",
  icons: {
    icon: "/editify-icon.svg",
    shortcut: "/editify-icon.svg",
    apple: "/editify-icon.svg",
  },
  openGraph: {
    title: "Edit-ify",
    description: "Video editor freelance platform",
    images: [{ url: "/editify-logo.svg", width: 520, height: 160, alt: "Edit-ify" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${plusJakartaSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
