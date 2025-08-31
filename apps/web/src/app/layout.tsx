import type { Metadata } from "next";
import "./globals.css";
import { Inter, Press_Start_2P } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

const arcade = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  preload: true,
  display: "swap",
  variable: "--font-arcade",
});

export const metadata: Metadata = {
  title: "Agent Mojo",
  description: "Agent Mojo • Arcade-themed AI Coding Agent",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
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
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var root = document.documentElement;
                  
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else if (theme === 'light') {
                    root.classList.add('light');
                  } else if (theme === 'system' || !theme) {
                    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                  }
                } catch (e) {
                  // Fallback to light theme if there's any error
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={cn(inter.className, arcade.variable)}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="theme"
        >
          <NuqsAdapter>{children}</NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
