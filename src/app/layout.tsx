import type { Metadata, Viewport } from "next";
import { Figtree, Newsreader } from "next/font/google";
import { DeviceProvider } from "@/components/device-provider";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "S.T.E.P.S. | Weekly Bible Study",
  description:
    "Scripture, Theme, Engagement, Prayer, and Share - a private weekly Bible study community.",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "S.T.E.P.S.",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f6f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${figtree.variable} ${newsreader.variable} h-full`}
    >
      <head>
        <meta name="robots" content="noindex, nofollow" />
        {/* Instant pre-hydration hint so first paint matches device class */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var w=window.innerWidth;var t=w<768?"mobile":w<1024?"tablet":"laptop";var c=t==="mobile"?"true":"false";var touch=window.matchMedia("(pointer: coarse)").matches||(navigator.maxTouchPoints||0)>0;var d=document.documentElement;d.dataset.device=t;d.dataset.compactUi=c;d.dataset.touch=touch?"true":"false";}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full antialiased text-ink">
        <DeviceProvider>{children}</DeviceProvider>
      </body>
    </html>
  );
}
