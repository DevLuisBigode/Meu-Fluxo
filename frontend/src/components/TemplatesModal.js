import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_COLORS } from "@/components/TimelineView.js";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TemplatesModal = ({ open, onClose, onUseTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
      toast.error("Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId) => {
    try {
      await axios.delete(`${API}/templates/${templateId}`);
      toast.success("Template deletado!");
      fetchTemplates();
    } catch (error) {
      console.error("Erro ao deletar template:", error);
      toast.error("Erro ao deletar template");
    }
  };

  const handleUse = (template) => {
    onUseTemplate({
      amount: template.amount,
      type: template.type,
      category: template.category,
      description: template.description,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="templates-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>Templates de Transações</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum template salvo ainda.</p>
            <p className="text-sm mt-2">Crie templates para reutilizar transações comuns.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {templates.map((template) => {
              const categoryColor = CATEGORY_COLORS[template.category] || "#64748B";
              const isIncome = template.type === "entrada";

              return (
                <div
                  key={template.id}
                  className="bg-background/50 rounded-2xl p-4 border border-border/30 hover:border-accent/50 transition-all group"
                  data-testid={`template-${template.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${categoryColor}20`,
                            color: categoryColor,
                          }}
                        >
                          {template.category}
                        </span>
                        <span className="text-sm font-bold text-muted-foreground">
                          {template.name}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">
                        {template.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <p
                        className={`text-2xl font-display font-bold ${
                          isIncome ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isIncome ? "+" : "-"} R$ {template.amount.toFixed(2)}
                      </p>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleUse(template)}
                          size="sm"
                          className="rounded-full"
                          data-testid={`use-template-${template.id}`}
                        >
                          Usar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                          className="rounded-full text-destructive hover:text-destructive"
                          data-testid={`delete-template-${template.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-full"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatesModal;