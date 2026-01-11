import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, TrendingDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import BudgetModal from "@/components/BudgetModal.js";
import { CATEGORY_COLORS } from "@/components/TimelineView.js";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Categories = () => {
  const [stats, setStats] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, budgetsRes] = await Promise.all([
        axios.get(`${API}/categories/stats`),
        axios.get(`${API}/budgets`),
      ]);
      setStats(statsRes.data);
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBudget = async (data) => {
    try {
      if (editingBudget) {
        await axios.put(`${API}/budgets/${editingBudget.id}`, { limit: data.limit });
        toast.success("Orçamento atualizado com sucesso!");
      } else {
        await axios.post(`${API}/budgets`, data);
        toast.success("Orçamento criado com sucesso!");
      }
      setModalOpen(false);
      setEditingBudget(null);
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      toast.error("Erro ao salvar orçamento");
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await axios.delete(`${API}/budgets/${id}`);
      toast.success("Orçamento deletado com sucesso!");
      fetchData();
    } catch (error) {
      console.error("Erro ao deletar orçamento:", error);
      toast.error("Erro ao deletar orçamento");
    }
  };

  const chartData = stats.map((stat) => ({
    name: stat.category,
    value: stat.total,
    color: CATEGORY_COLORS[stat.category] || "#64748B",
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-display font-bold tracking-tight">
            Categorias & Orçamentos
          </h2>
          <p className="text-muted-foreground mt-2">
            Visualize e controle seus gastos por categoria
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBudget(null);
            setModalOpen(true);
          }}
          className="rounded-full px-6 py-6 shadow-lg hover:shadow-xl transition-all"
          data-testid="add-budget-button"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {stats.length === 0 ? (
        <div className="text-center py-20" data-testid="no-categories">
          <TrendingDown className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum gasto registrado</h3>
          <p className="text-muted-foreground">Comece adicionando transações para ver a análise por categorias</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-3xl border border-border/50 p-8 shadow-sm">
            <h3 className="text-2xl font-display font-bold mb-6">Distribuição de Gastos</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={140}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {stats.map((stat) => {
              const hasExceeded = stat.budget_limit && stat.total > stat.budget_limit;
              const isNearLimit = stat.budget_limit && stat.remaining && stat.remaining < stat.budget_limit * 0.2;
              const categoryColor = CATEGORY_COLORS[stat.category] || "#64748B";
              
              return (
                <div
                  key={stat.category}
                  className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm"
                  data-testid={`category-${stat.category}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoryColor }}
                      />
                      <div>
                        <h4 className="font-semibold text-lg">{stat.category}</h4>
                        <p className="text-sm text-muted-foreground">
                          {stat.percentage.toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-display font-bold text-rose-600">
                        R$ {stat.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {stat.budget_limit && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Orçamento mensal</span>
                        <span className={hasExceeded ? "text-rose-600 font-semibold" : "text-emerald-600"}>
                          {hasExceeded ? "Excedido!" : `R$ ${stat.remaining?.toFixed(2)} restante`}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            hasExceeded
                              ? "bg-rose-500"
                              : isNearLimit
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min((stat.total / stat.budget_limit) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>R$ 0</span>
                        <span>R$ {stat.budget_limit.toFixed(2)}</span>
                      </div>
                      
                      {hasExceeded && (
                        <div className="mt-3 flex items-center space-x-2 text-sm text-rose-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Você gastou R$ {(stat.total - stat.budget_limit).toFixed(2)} a mais que o planejado</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BudgetModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        budget={editingBudget}
      />
    </div>
  );
};

export default Categories;