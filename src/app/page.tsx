import ChatWindow from "@/components/ChatWindow/ChatWindow";

export default function Home() {
  return (
    <div className="flex h-screen w-full">
      <div className="w-[15%] h-screen"></div>
      <div className="w-[70%] h-screen">
        <ChatWindow emptyStateComponent={""} placeholder="111" />
      </div>
      <div className="flex-1 h-screen"></div>
    </div>
  );
}
