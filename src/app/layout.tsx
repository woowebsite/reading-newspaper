import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reading Newspaper — Đọc báo thông minh",
  description: "Tổng hợp và tóm tắt tin tức hàng ngày theo sở thích cá nhân. Theo dõi nhiều nguồn báo, phân tích thói quen đọc, tóm tắt AI với Gemini.",
  keywords: ["đọc báo", "tin tức", "tóm tắt tin", "news aggregator", "Gemini AI"],
  openGraph: {
    title: "Reading Newspaper",
    description: "Đọc báo thông minh với AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📰</text></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
