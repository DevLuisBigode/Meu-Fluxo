import React from "react";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

const CATEGORY_COLORS = {
  "Salário": "#10B981",
  "Moradia": "#F59E0B",
  "Alimentação": "#EF4444",
  "Transporte": "#3B82F6",
  "Lazer": "#EC4899",
  "Saúde": "#14B8A6",
  "Educação": "#8B5CF6",
  "Compras": "#F97316",
  "Cartão de Crédito": "#6366F1",
  "Outros": "#64748B",
};

const TimelineView = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const upcomingTransactions = transactions
    .filter(t => {
      const transDate = new Date(t.date);
      return transDate > now && transDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (upcomingTransactions.length === 0) {
    return null;
  }

  // Calcular saldo acumulado
  let runningBalance = 0;
  const transactionsWithBalance = upcomingTransactions.map(t => {
    if (t.type === "entrada") {
      runningBalance += t.amount;
    } else {
      runningBalance -= t.amount;
    }
    return { ...t, balance: runningBalance };
  });

  return (
    <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm" data-testid="timeline-view">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold">Timeline - Próximos 30 Dias</h3>
            <p className="text-sm text-muted-foreground">
              {upcomingTransactions.length} {upcomingTransactions.length === 1 ? "transação programada" : "transações programadas"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Linha do tempo */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>

        <div className="space-y-6">
          {transactionsWithBalance.map((transaction, index) => {
            const transDate = new Date(transaction.date);
            const daysUntil = Math.ceil((transDate - now) / (1000 * 60 * 60 * 24));
            const isIncome = transaction.type === "entrada";
            const categoryColor = CATEGORY_COLORS[transaction.category] || "#64748B";

            return (
              <div key={transaction.id} className="relative pl-20">
                {/* Círculo na linha do tempo */}
                <div
                  className="absolute left-6 w-5 h-5 rounded-full border-4 border-background"
                  style={{ backgroundColor: categoryColor }}
                ></div>

                {/* Card da transação */}
                <div
                  className="bg-background/50 rounded-2xl p-4 border border-border/30 hover:border-accent/50 transition-all hover:shadow-md"
                  data-testid={`timeline-transaction-${transaction.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${categoryColor}20`,
                            color: categoryColor,
                          }}
                        >
                          {transaction.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Em {daysUntil} {daysUntil === 1 ? "dia" : "dias"}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transDate.toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {isIncome ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-rose-500" />
                        )}
                        <p
                          className={`text-xl font-display font-bold ${
                            isIncome ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isIncome ? "+" : "-"}R$ {transaction.amount.toFixed(2)}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-medium mt-1 ${
                          transaction.balance >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        Saldo: R$ {transaction.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Alerta se saldo ficar negativo */}
                  {transaction.balance < 0 && (
                    <div className="mt-3 p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                      <p className="text-xs text-rose-600 font-medium">
                        ⚠️ Atenção: Saldo ficará negativo após esta transação
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
export { CATEGORY_COLORS };