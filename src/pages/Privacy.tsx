
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from "react";

const Privacy = () => {
  const navigate = useNavigate();
  const [privacy, setPrivacy] = useState("");

  useEffect(() => {
    fetch("/privacy.md")
      .then((res) => res.text())
      .then((text) => setPrivacy(text));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sensa-purple/20 to-sensa-lime/20 p-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/auth")}
          className="mb-6 hover:bg-white/50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al registro
        </Button>
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl">
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>
              {privacy}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
