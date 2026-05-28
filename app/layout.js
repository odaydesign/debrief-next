import { Playfair_Display, Inter } from "next/font/google";
import { AppProviders } from "./providers";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: "Debrief",
  description: "Your daily news briefing",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="sv"
      className={`${playfairDisplay.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
