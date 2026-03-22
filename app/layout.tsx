import type { Metadata } from "next";
import './globals.css';
import { Toaster } from "react-hot-toast";


export const metadata: Metadata = {
  title: "オーリン様の予算トラッカー",
  description: "Personal budget tracking application built with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
        <Toaster position="top-right" reverseOrder={false} />
      </body>
    </html>
  );
}