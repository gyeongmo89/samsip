import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { DataProvider } from "@/contexts/DataContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
// export const metadata: Metadata = {
//   title: "삼십일미 발주관리 시스템",
//   description: "발주관리 시스템",
//   icons: {
//     icon: [
//       { url: '/favicon.ico', sizes: 'any' },
//       { url: '/favicon.ico', sizes: '32x32' },
//     ],
//   },
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <title>삼십일미 발주관리 시스템</title>
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <DataProvider>
          <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-4">
            {children}
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
