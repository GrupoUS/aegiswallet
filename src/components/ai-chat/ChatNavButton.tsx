
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ChatNavButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      onClick={() => navigate("/chat")}
      className="flex items-center gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      Chat IA
    </Button>
  );
};

export default ChatNavButton;
