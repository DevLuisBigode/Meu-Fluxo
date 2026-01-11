import React, { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown, Equal } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Comparison = () => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/stats/comparison`);
      setComparison(response.data);
    } catch (error) {
      console.error("Erro ao carregar comparação:", error);
      toast.error("Erro ao carregar comparação");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Nenhum dado disponível para comparação</p>
      </div>
    );
  }

  const renderChangeIndicator = (value) => {
    if (value > 0) {
      return (
        <span className="flex items-center text-emerald-600 font-semibold">
          <TrendingUp className="w-4 h-4 mr-1" />
          +{value.toFixed(1)}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center text-rose-600 font-semibold">
          <TrendingDown className="w-4 h-4 mr-1" />
          {value.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="flex items-center text-muted-foreground font-semibold">
        <Equal className="w-4 h-4 mr-1" />
        Sem mudança
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-display font-bold tracking-tight">
          Comparação de Períodos
        </h2>
        <p className="text-muted-foreground mt-2">
          Mês atual vs mês anterior
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
            Receitas
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Mês Anterior</p>
              <p className="text-2xl font-display font-bold">
                R$ {comparison.previous_period.total_income.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mês Atual</p>
              <p className="text-3xl font-display font-bold text-emerald-600">
                R$ {comparison.current_period.total_income.toFixed(2)}
              </p>
            </div>
            <div className="pt-3 border-t border-border">
              {renderChangeIndicator(comparison.income_change)}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
            Despesas
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Mês Anterior</p>
              <p className="text-2xl font-display font-bold">
                R$ {comparison.previous_period.total_expense.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mês Atual</p>
              <p className="text-3xl font-display font-bold text-rose-600">
                R$ {comparison.current_period.total_expense.toFixed(2)}
              </p>
            </div>
            <div className="pt-3 border-t border-border">
              {renderChangeIndicator(comparison.expense_change)}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
            Saldo
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Mês Anterior</p>
              <p className={`text-2xl font-display font-bold ${
                comparison.previous_period.balance >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}>
                R$ {comparison.previous_period.balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mês Atual</p>
              <p className={`text-3xl font-display font-bold ${
                comparison.current_period.balance >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}>
                R$ {comparison.current_period.balance.toFixed(2)}
              </p>
            </div>
            <div className="pt-3 border-t border-border">
              <span className={`font-semibold ${
                comparison.balance_change >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}>
                {comparison.balance_change >= 0 ? "+" : ""}
                R$ {comparison.balance_change.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl border border-primary/20 p-8">
        <h3 className="text-2xl font-display font-bold mb-4">Análise Resumida</h3>
        <div className="space-y-3 text-foreground/90">
          {comparison.income_change > 0 ? (
            <p>✅ Suas receitas aumentaram {comparison.income_change.toFixed(1)}% em relação ao mês passado.</p>
          ) : comparison.income_change < 0 ? (
            <p>⚠️ Suas receitas diminuíram {Math.abs(comparison.income_change).toFixed(1)}% em relação ao mês passado.</p>
          ) : (
            <p>➡️ Suas receitas se mantiveram estáveis em relação ao mês passado.</p>
          )}
          
          {comparison.expense_change > 0 ? (
            <p>⚠️ Seus gastos aumentaram {comparison.expense_change.toFixed(1)}% em relação ao mês passado.</p>
          ) : comparison.expense_change < 0 ? (
            <p>✅ Seus gastos diminuíram {Math.abs(comparison.expense_change).toFixed(1)}% em relação ao mês passado.</p>
          ) : (
            <p>➡️ Seus gastos se mantiveram estáveis em relação ao mês passado.</p>
          )}
          
          {comparison.balance_change > 0 ? (
            <p className="text-emerald-600 font-semibold">🎉 Parabéns! Seu saldo melhorou R$ {comparison.balance_change.toFixed(2)} este mês!</p>
          ) : comparison.balance_change < 0 ? (
            <p className="text-rose-600 font-semibold">⚠️ Atenção: Seu saldo diminuiu R$ {Math.abs(comparison.balance_change).toFixed(2)} este mês.</p>
          ) : (
            <p>➡️ Seu saldo se manteve igual ao mês passado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comparison;