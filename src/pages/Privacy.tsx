
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
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold text-sensa-purple mb-8">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-medium text-gray-700 mt-6 mb-3">{children}</h3>,
              p: ({ children }) => <p className="text, text-gray-600 mb-4 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-4 text-gray-600">{children}</ul>,
              li: ({ children }) => <li className="mb-2">{children}</li>,
            }}>
              {privacy}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
