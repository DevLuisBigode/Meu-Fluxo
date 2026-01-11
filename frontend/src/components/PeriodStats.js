import React from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

const PeriodStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="period-stats">
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl border border-emerald-500/20 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
            Entradas
          </p>
        </div>
        <p className="text-4xl font-display font-bold text-emerald-600" data-testid="total-income">
          R$ {stats.total_income.toFixed(2)}
        </p>
      </div>

      <div className="bg-gradient-to-br from-rose-500/10 to-red-500/10 rounded-3xl border border-rose-500/20 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
            Saídas
          </p>
        </div>
        <p className="text-4xl font-display font-bold text-rose-600" data-testid="total-expense">
          R$ {stats.total_expense.toFixed(2)}
        </p>
      </div>

      <div
        className={`bg-gradient-to-br ${
          stats.balance >= 0
            ? "from-emerald-500/10 to-teal-500/10 border-emerald-500/20"
            : "from-rose-500/10 to-red-500/10 border-rose-500/20"
        } rounded-3xl border p-6`}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div
            className={`w-12 h-12 rounded-full ${
              stats.balance >= 0 ? "bg-emerald-500" : "bg-rose-500"
            } flex items-center justify-center`}
          >
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
            Saldo
          </p>
        </div>
        <p
          className={`text-4xl font-display font-bold ${
            stats.balance >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
          data-testid="total-balance"
        >
          R$ {stats.balance.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default PeriodStats;