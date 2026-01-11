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

const BudgetModal = ({ open, onClose, onSave, budget }) => {
  const [formData, setFormData] = useState({
    category: "",
    limit: "",
    period: "month",
  });

  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        limit: budget.limit.toString(),
        period: budget.period,
      });
    } else {
      setFormData({
        category: "",
        limit: "",
        period: "month",
      });
    }
  }, [budget, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      limit: parseFloat(formData.limit),
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
    "Outros",
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="budget-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold">
            {budget ? "Editar Orçamento" : "Novo Orçamento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Categoria
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
              disabled={!!budget}
            >
              <SelectTrigger id="category" data-testid="budget-category-select">
                <SelectValue placeholder="Selecione uma categoria" />
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

          <div className="space-y-2">
            <Label htmlFor="limit" className="text-sm font-medium">
              Limite (R$)
            </Label>
            <Input
              id="limit"
              type="number"
              step="0.01"
              value={formData.limit}
              onChange={(e) =>
                setFormData({ ...formData, limit: e.target.value })
              }
              className="text-lg"
              required
              data-testid="budget-limit-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period" className="text-sm font-medium">
              Período
            </Label>
            <Select
              value={formData.period}
              onValueChange={(value) =>
                setFormData({ ...formData, period: value })
              }
            >
              <SelectTrigger id="period" data-testid="budget-period-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mensal</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-full"
              data-testid="budget-cancel-button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-full px-8"
              data-testid="budget-save-button"
            >
              {budget ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetModal;