import { Anton, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "SplitBuddy | Share Expenses Elegantly",
  description: "A premium splitwise clone",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen relative selection:bg-shiraz-200 selection:text-shiraz-900">
        <div className="noise-overlay" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
