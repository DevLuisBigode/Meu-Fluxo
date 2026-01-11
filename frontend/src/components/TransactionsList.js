import React from "react";
import { Pencil, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const TransactionsList = ({ transactions, onEdit, onDelete }) => {
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

  return (
    <div className="space-y-3" data-testid="transactions-list">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === "entrada";
        return (
          <div
            key={transaction.id}
            className="bg-background/50 rounded-2xl p-4 hover:bg-accent/5 transition-all border border-border/30 group"
            data-testid={`transaction-${transaction.id}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isIncome
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-rose-500/10 text-rose-600"
                    }`}
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