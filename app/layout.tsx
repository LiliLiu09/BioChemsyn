import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "凯森斯生物 KASONS 科研试剂与化学品产品库",
  description: "凯森斯生物 KASONS 面向科研试剂、标准品与化学品采购的 B2B 产品展示、搜索与询价网站"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
