import React, { useState } from "react";
import { Pencil, Trash2, Bell, GripVertical, Square, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS } from "@/components/TimelineView.js";

const TransactionsList = ({ 
  transactions, 
  onEdit, 
  onDelete, 
  onBulkDelete,
  showBulkActions = false 
}) => {
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground" data-testid="no-transactions">
        Nenhuma transação encontrada
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR");
  };

  const toggleSelection = (transactionId) => {
    if (selectedTransactions.includes(transactionId)) {
      setSelectedTransactions(selectedTransactions.filter(id => id !== transactionId));
    } else {
      setSelectedTransactions([...selectedTransactions, transactionId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t.id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Deseja realmente deletar ${selectedTransactions.length} transações?`)) {
      onBulkDelete(selectedTransactions);
      setSelectedTransactions([]);
    }
  };

  const handleDragStart = (e, transaction) => {
    setDraggedItem(transaction);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetTransaction) => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== targetTransaction.id) {
      // Aqui você pode implementar a lógica de reordenação
      console.log(`Movendo ${draggedItem.description} para posição de ${targetTransaction.description}`);
    }
    setDraggedItem(null);
  };

  return (
    <div className="space-y-3" data-testid="transactions-list">
      {showBulkActions && (
        <div className="flex items-center justify-between mb-4 p-3 bg-accent/5 rounded-2xl border border-accent/20">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="rounded-full"
            >
              {selectedTransactions.length === transactions.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="ml-2">
                {selectedTransactions.length === transactions.length ? "Desmarcar todos" : "Selecionar todos"}
              </span>
            </Button>
            {selectedTransactions.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedTransactions.length} selecionada(s)
              </span>
            )}
          </div>
          {selectedTransactions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="rounded-full"
              data-testid="bulk-delete-button"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar selecionadas
            </Button>
          )}
        </div>
      )}

      {transactions.map((transaction) => {
        const isIncome = transaction.type === "entrada";
        const categoryColor = CATEGORY_COLORS[transaction.category] || "#64748B";
        const isSelected = selectedTransactions.includes(transaction.id);

        return (
          <div
            key={transaction.id}
            className={`bg-background/50 rounded-2xl p-4 hover:bg-accent/5 transition-all border group ${
              isSelected
                ? "border-primary shadow-lg"
                : draggedItem?.id === transaction.id
                ? "border-accent/50 opacity-50"
                : "border-border/30"
            }`}
            data-testid={`transaction-${transaction.id}`}
            draggable
            onDragStart={(e) => handleDragStart(e, transaction)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, transaction)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {showBulkActions && (
                  <button
                    onClick={() => toggleSelection(transaction.id)}
                    className="flex-shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                )}
                
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${categoryColor}20`,
                        color: categoryColor,
                      }}
                    >
                      {transaction.category}
                    </span>
                    {transaction.has_reminder && (
                      <Bell className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                  <p className="font-medium text-foreground">
                    {transaction.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p
                    className={`text-2xl font-display font-bold ${
                      isIncome ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"} R$ {transaction.amount.toFixed(2)}
                  </p>
                </div>

                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(transaction)}
                    className="rounded-full"
                    data-testid={`edit-transaction-${transaction.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(transaction.id)}
                    className="rounded-full text-destructive hover:text-destructive"
                    data-testid={`delete-transaction-${transaction.id}`}
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
  );
};

export default TransactionsList;
