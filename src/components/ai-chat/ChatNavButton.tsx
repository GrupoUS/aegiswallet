
'use client'; // Adicionado

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // Alterado

const ChatNavButton = () => {
  const router = useRouter(); // Alterado

  return (
    <Button
      variant="ghost"
      onClick={() => router.push("/chat")} // Alterado
      className="flex items-center gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      Chat IA
    </Button>
  );
};

export default ChatNavButton;
