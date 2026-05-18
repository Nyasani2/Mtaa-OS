import "./globals.css"
import NavShell from "@/components/os/NavShell"

export const metadata = {
  title: "MTAA AFRIQ",
  description: "City-Level Operating System for Africa"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">

        {/* MAIN APP CONTENT */}
        {children}

        {/* 🧭 OS NAVIGATION SHELL LAYER (PERSISTENT) */}
        <NavShell />

      </body>
    </html>
  )
}
