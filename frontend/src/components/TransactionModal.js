import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Bookmark } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import WeekdaysSelector from "@/components/WeekdaysSelector.js";
import DayOfMonthSelector from "@/components/DayOfMonthSelector.js";
import TemplatesModal from "@/components/TemplatesModal.js";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TransactionModal = ({ open, onClose, onSave, transaction }) => {
  const [formData, setFormData] = useState({
    amount: "",
    date: "",
    type: "saida",
    category: "",
    description: "",
    has_reminder: false,
    is_recurring: false,
    recurring_frequency: "monthly",
    recurring_weekdays: [],
    recurring_day_of_month: null,
    recurring_end_date: "",
  });
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount.toString(),
        date: transaction.date.split("T")[0],
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        has_reminder: transaction.has_reminder,
        is_recurring: false,
        recurring_frequency: "monthly",
        recurring_weekdays: [],
        recurring_day_of_month: null,
        recurring_end_date: "",
      });
    } else {
      const today = new Date();
      setFormData({
        amount: "",
        date: today.toISOString().split("T")[0],
        type: "saida",
        category: "",
        description: "",
        has_reminder: false,
        is_recurring: false,
        recurring_frequency: "monthly",
        recurring_weekdays: [],
        recurring_day_of_month: null,
        recurring_end_date: "",
      });
    }
  }, [transaction, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      recurring_end_date: formData.recurring_end_date ? new Date(formData.recurring_end_date).toISOString() : null,
    };
    
    await onSave(data);

    if (saveAsTemplate && !transaction) {
      try {
        await axios.post(`${API}/templates`, {
          name: templateName || formData.description,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          description: formData.description,
        });
        toast.success("Template salvo!");
      } catch (error) {
        console.error("Erro ao salvar template:", error);
      }
    }
    
    setSaveAsTemplate(false);
    setTemplateName("");
  };

  const handleUseTemplate = (templateData) => {
    setFormData({
      ...formData,
      ...templateData,
      date: new Date().toISOString().split("T")[0],
    });
  };

  const categories = [
    "Salário",
    "Moradia",
    "Alimentação",
    "Transporte",
    "Lazer",
    "Saúde",
    "Educação",
    "Compras",
    "Cartão de Crédito",
    "Outros",
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="transaction-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold flex items-center justify-between">
              <span>{transaction ? "Editar Transação" : "Nova Transação"}</span>
              {!transaction && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTemplatesModalOpen(true)}
                  className="rounded-full"
                  data-testid="open-templates"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Templates
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Valor (R$)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="text-lg"
                  required
                  data-testid="amount-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Data
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  data-testid="date-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Tipo
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type" data-testid="type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Categoria
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category" data-testid="category-select">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                data-testid="description-input"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="reminder" className="text-sm font-medium">
                Ativar Lembrete
              </Label>
              <Switch
                id="reminder"
                checked={formData.has_reminder}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, has_reminder: checked })
                }
                data-testid="reminder-switch"
              />
            </div>

            {!transaction && (
              <>
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2">
                    <Bookmark className="w-4 h-4 text-primary" />
                    <Label htmlFor="save-template" className="text-sm font-medium">
                      Salvar como Template
                    </Label>
                  </div>
                  <Switch
                    id="save-template"
                    checked={saveAsTemplate}
                    onCheckedChange={setSaveAsTemplate}
                    data-testid="template-switch"
                  />
                </div>

                {saveAsTemplate && (
                  <div className="space-y-2">
                    <Label htmlFor="template-name" className="text-sm font-medium">
                      Nome do Template (opcional)
                    </Label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Ex: Aluguel mensal"
                      data-testid="template-name-input"
                    />
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="recurring" className="text-sm font-medium">
                    Transação Recorrente
                  </Label>
                  <Switch
                    id="recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_recurring: checked })
                    }
                    data-testid="recurring-switch"
                  />
                </div>

                {formData.is_recurring && (
                  <div className="space-y-4 p-4 bg-accent/5 rounded-2xl border border-accent/20">
                    <div className="space-y-2">
                      <Label htmlFor="frequency" className="text-sm font-medium">
                        Frequência
                      </Label>
                      <Select
                        value={formData.recurring_frequency}
                        onValueChange={(value) =>
                          setFormData({ ...formData, recurring_frequency: value })
                        }
                      >
                        <SelectTrigger id="frequency" data-testid="frequency-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                          <SelectItem value="yearly">Anualmente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.recurring_frequency === "weekly" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Dias da Semana</Label>
                        <WeekdaysSelector
                          selected={formData.recurring_weekdays}
                          onChange={(days) =>
                            setFormData({ ...formData, recurring_weekdays: days })
                          }
                        />
                      </div>
                    )}

                    {formData.recurring_frequency === "monthly" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Dia do Mês</Label>
                        <DayOfMonthSelector
                          selected={formData.recurring_day_of_month}
                          onChange={(day) =>
                            setFormData({ ...formData, recurring_day_of_month: day })
                          }
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="end_date" className="text-sm font-medium">
                        Data Final (Opcional)
                      </Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.recurring_end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, recurring_end_date: e.target.value })
                        }
                        data-testid="end-date-input"
                        min={formData.date}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="rounded-full"
                data-testid="cancel-button"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-full px-8"
                data-testid="save-button"
              >
                {transaction ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TemplatesModal
        open={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onUseTemplate={handleUseTemplate}
      />
    </>
  );
};

export default TransactionModal;