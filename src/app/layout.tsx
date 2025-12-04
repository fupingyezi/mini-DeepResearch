import "./globals.css";
import Sider from "@/components/Sider/Sider";
import DeepResearchProcess from "@/components/Process/DeepResearchProcess";

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
        <DeepResearchProcess />
      </body>
    </html>
  );
}
