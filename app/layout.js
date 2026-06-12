import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "./providers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Debrief — Din dagliga nyhetsbrief",
    template: "%s – Debrief",
  },
  description:
    "Dagens viktigaste nyheter, handplockade och sammanfattade. Ett nummer om dagen — läs klart och var ikapp.",
  applicationName: "Debrief",
  appleWebApp: {
    capable: true,
    title: "Debrief",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  openGraph: {
    siteName: "Debrief",
    locale: "sv_SE",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#26231f",
};

// Set the theme before first paint to avoid a flash of the wrong theme.
const themeBootstrap = `try{document.documentElement.dataset.theme=localStorage.getItem('debrief-theme')||'ink'}catch(e){document.documentElement.dataset.theme='ink'}`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="sv"
      data-theme="ink"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-bg text-ink">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
