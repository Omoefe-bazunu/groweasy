import { Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { UserProvider } from "@/context/UserContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

// ✅ Correct Metadata (No themeColor here)
export const metadata = {
  title: "GrowEasy | Simplify Your Business Processes",
  description: "The ultimate business tool for streamlined workflows.",
  // manifest: "/manifest.json",
  // appleWebApp: {
  //   capable: true,
  //   statusBarStyle: "default",
  //   title: "GrowEasy",
  // },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// ✅ Correct Viewport Export (themeColor moved here)
export const viewport = {
  themeColor: "#5247bf",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body className="font-sans antialiased bg-brand-warm text-foreground">
        <UserProvider>
          <SubscriptionProvider>
            <LayoutWrapper>
              <main className="animate-page-reveal">{children}</main>
            </LayoutWrapper>
          </SubscriptionProvider>
        </UserProvider>

        {/* Tawk.to Live Chat Script */}
        <Script id="tawk-script" strategy="afterInteractive">
          {`
            var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
            (function(){
              var s1 = document.createElement("script"),
                  s0 = document.getElementsByTagName("script")[0];
              s1.async = true;
              s1.src = 'https://embed.tawk.to/682de0df17c3c91910298e66/1irpjd0ra';
              s1.charset = 'UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1, s0);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
