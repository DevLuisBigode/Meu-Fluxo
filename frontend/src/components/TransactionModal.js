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

const TransactionModal = ({ open, onClose, onSave, transaction }) => {
  const [formData, setFormData] = useState({
    amount: "",
    date: "",
    type: "saida",
    category: "",
    description: "",
    has_reminder: false,
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount.toString(),
        date: transaction.date.split("T")[0],
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        has_reminder: transaction.has_reminder,
      });
    } else {
      setFormData({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        type: "saida",
        category: "",
        description: "",
        has_reminder: false,
      });
    }
  }, [transaction, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
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
      <DialogContent className="sm:max-w-[500px]" data-testid="transaction-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold">
            {transaction ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="flex items-center justify-between">
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
  );
};

export default TransactionModal;