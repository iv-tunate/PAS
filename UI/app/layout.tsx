import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grow with Akintola Samuel — A Quiet Space for Study",
  description:
    "A quiet online space for biblical study, reflection, and mentoring with Akintola Samuel.",
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored ? stored : 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${fraunces.variable} ${sourceSans.variable} font-body bg-parchment text-ink dark:bg-ink dark:text-parchment transition-colors duration-300`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
