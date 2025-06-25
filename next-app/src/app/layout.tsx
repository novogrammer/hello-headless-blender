import type { Metadata } from "next";
import "./globals.scss";


export const metadata: Metadata = {
  title: "Hello Headless Next App",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
