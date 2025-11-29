import "./globals.css";
import Sider from "@/components/Sider";
import { ClientInitializer } from "@/components/ClientInitializer";
import { apiClient } from "@/utils";

async function getConversationSessions() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/conversations/sessions`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("initial sessions data:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch conversation sessions:", error);
    return { data: [] };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const sessionsData = await getConversationSessions();

  return (
    <html lang="en">
      <body className="flex overflow-hidden">
        {/* <ClientInitializer initialData={sessionsData.data || []} /> */}
        <Sider />
        {children}
      </body>
    </html>
  );
}
