import "./globals.css";
import Sider from "@/components/Sider/Sider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex overflow-hidden">
        <Sider />
        {children}
      </body>
    </html>
  );
}
