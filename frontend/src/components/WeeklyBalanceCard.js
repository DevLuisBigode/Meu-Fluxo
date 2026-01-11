import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const WeeklyBalanceCard = ({ stats }) => {
  if (!stats) return null;

  const isPositive = stats.balance >= 0;
  const balanceColor = isPositive ? "balance-positive" : "balance-negative";
  const bgGradient = isPositive
    ? "from-emerald-500/10 to-teal-500/10"
    : "from-rose-500/10 to-red-500/10";

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${bgGradient} rounded-3xl border-2 ${
        isPositive ? "border-emerald-500/20" : "border-rose-500/20"
      } p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300`}
      data-testid="weekly-balance-card"
    >
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
        {isPositive ? (
          <TrendingUp className="w-full h-full" />
        ) : (
          <TrendingDown className="w-full h-full" />
        )}
      </div>

      <div className="relative z-10">
        <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Saldo da Semana
        </p>
        <h2
          className={`text-6xl md:text-7xl font-display font-black ${balanceColor} mb-6`}
          data-testid="weekly-balance-amount"
        >
          R$ {stats.balance.toFixed(2)}
        </h2>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Entradas</p>
            <p className="text-2xl font-display font-bold text-emerald-600" data-testid="weekly-income">
              R$ {stats.total_income.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Saídas</p>
            <p className="text-2xl font-display font-bold text-rose-600" data-testid="weekly-expense">
              R$ {stats.total_expense.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyBalanceCard;