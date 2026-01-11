import React from "react";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { CATEGORY_COLORS } from "@/components/TimelineView.js";

const UpcomingTransactions = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const now = new Date();
  const upcoming = transactions.filter(t => {
    const transDate = new Date(t.date);
    return transDate > now;
  });

  if (upcoming.length === 0) {
    return null;
  }

  const upcomingIncome = upcoming.filter(t => t.type === "entrada");
  const upcomingExpense = upcoming.filter(t => t.type === "saida");

  const totalIncome = upcomingIncome.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = upcomingExpense.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6" data-testid="upcoming-transactions">
      {upcomingIncome.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-emerald-700 dark:text-emerald-400">
                  Prestes à Entrar
                </h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-500">
                  {upcomingIncome.length} {upcomingIncome.length === 1 ? "transação" : "transações"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-display font-bold text-emerald-600">
                R$ {totalIncome.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {upcomingIncome.map((transaction) => {
              const categoryColor = CATEGORY_COLORS[transaction.category] || "#64748B";
              return (
                <div
                  key={transaction.id}
                  className="bg-white/60 dark:bg-emerald-950/30 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <div className="flex items-center space-x-2">
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${categoryColor}20`,
                            color: categoryColor,
                          }}
                        >
                          {transaction.category}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-display font-bold text-emerald-600">
                    +R$ {transaction.amount.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {upcomingExpense.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 rounded-3xl border-2 border-rose-200 dark:border-rose-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-rose-700 dark:text-rose-400">
                  Prestes à Sair
                </h3>
                <p className="text-sm text-rose-600 dark:text-rose-500">
                  {upcomingExpense.length} {upcomingExpense.length === 1 ? "transação" : "transações"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-display font-bold text-rose-600">
                R$ {totalExpense.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {upcomingExpense.map((transaction) => {
              const categoryColor = CATEGORY_COLORS[transaction.category] || "#64748B";
              return (
                <div
                  key={transaction.id}
                  className="bg-white/60 dark:bg-rose-950/30 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <Clock className="w-4 h-4 text-rose-600" />
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <div className="flex items-center space-x-2">
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${categoryColor}20`,
                            color: categoryColor,
                          }}
                        >
                          {transaction.category}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-display font-bold text-rose-600">
                    -R$ {transaction.amount.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingTransactions;
