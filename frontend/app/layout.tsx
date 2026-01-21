import Providers from "@/components/providers";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProfessionalsBD | Premium Expert Network",
  description: "Connect instantly with vetted legal, financial, and medical professionals in Bangladesh.",
  keywords: ["professionals", "experts", "bangladesh", "legal", "financial", "medical", "consultation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://esm.sh/@stream-io/video-react-sdk@^1.30.0/dist/css/styles.css" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Providers>
          {children}
          {/* <AIChatWidget /> */}
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}

