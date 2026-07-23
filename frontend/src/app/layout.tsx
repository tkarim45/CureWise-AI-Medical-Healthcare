import type { Metadata } from "next";
import { Archivo, Azeret_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";

// Two families only (see DESIGN.md): Archivo for everything readable,
// Azeret Mono for indices, identifiers and measurements.
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const azeretMono = Azeret_Mono({ subsets: ["latin"], variable: "--font-azeret" });

export const metadata: Metadata = {
  title: "CureWise — Your calm AI health companion",
  description:
    "Understand your blood reports, screen images across seven conditions, and ask a grounded medical assistant. CureWise informs; it does not diagnose.",
};

// Set the theme before first paint to avoid a flash of the wrong theme.
// Default is light; users can switch to dark and the choice is remembered.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('curewise-theme');
    var theme = stored === 'dark' ? 'dark' : 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${azeretMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
