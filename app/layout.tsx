import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChemHub B2B 轻量 CMS 产品站",
  description: "可后台编辑内容的 B2B 化学品产品展示与询价网站"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
