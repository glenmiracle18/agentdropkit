import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/navigation";
import SiteFooter from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";
import QueryProvider from "@/components/query-provider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "AgentDropkit - Prebuilt Claude Skills Directory",
  description:
    "Browse, search, and grab prebuilt skills, MCP servers, and agent tools for Claude and other coding agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Analytics />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider />
            <Navigation />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
