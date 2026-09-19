import { Geist_Mono, Inter } from "next/font/google"

import "@/app/globals.css"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { FlashProvider } from "@/components/providers/flash-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
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
            <FlashProvider>
              {children}
              <Toaster position="top-center" />
            </FlashProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
