import { Geist_Mono, Inter } from "next/font/google"

import "@/app/globals.css"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { AlertProvider } from "@/components/providers/alert-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <AlertProvider>{children}</AlertProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
