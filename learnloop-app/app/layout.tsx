import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. Import the Footer component (assuming it's in your components folder)
import Footer from "@/components/Footer"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LearnLoop", // I updated this for you based on your project
  description: "A shared course library for university study materials",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* 
        Your body already has 'flex flex-col' and 'min-h-full'. 
        This means if we add the Footer below {children}, it will naturally 
        sit at the bottom of the screen on short pages, and push down on long pages!
      */}
      <body className="min-h-full flex flex-col">
        {/* The main content area */}
        <div className="flex-grow">
          {children}
        </div>
        
        {/* 2. Add the Footer here */}
        <Footer />
      </body>
    </html>
  );
}