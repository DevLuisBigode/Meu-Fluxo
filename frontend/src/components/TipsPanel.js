import React, { useState, useEffect } from "react";
import axios from "axios";
import { Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TipsPanel = ({ period = "week" }) => {
  const [tips, setTips] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTips = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/tips`, { period });
      setTips(response.data.tips);
    } catch (error) {
      console.error("Erro ao gerar dicas:", error);
      toast.error("Erro ao gerar dicas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, [period]);

  return (
    <div
      className="glass-card rounded-3xl p-6 shadow-sm h-full"
      data-testid="tips-panel"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-display font-bold">Dicas Inteligentes</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchTips}
          disabled={loading}
          className="rounded-full"
          data-testid="refresh-tips-button"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line" data-testid="tips-content">
            {tips || "Carregando dicas..."}
          </p>
        </div>
      )}
    </div>
  );
};

export default TipsPanel;