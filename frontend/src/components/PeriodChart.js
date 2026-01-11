import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PeriodChart = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const groupByDate = transactions.reduce((acc, t) => {
    const date = new Date(t.date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    if (!acc[date]) {
      acc[date] = { date, entradas: 0, saidas: 0 };
    }
    if (t.type === "entrada") {
      acc[date].entradas += t.amount;
    } else {
      acc[date].saidas += t.amount;
    }
    return acc;
  }, {});

  const chartData = Object.values(groupByDate)
    .sort((a, b) => {
      const [dayA, monthA] = a.date.split("/");
      const [dayB, monthB] = b.date.split("/");
      return new Date(`2024-${monthA}-${dayA}`) - new Date(`2024-${monthB}-${dayB}`);
    })
    .slice(-10);

  return (
    <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm" data-testid="period-chart">
      <h3 className="text-2xl font-display font-bold mb-6">Fluxo de Caixa</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
          <YAxis stroke="hsl(var(--foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
            }}
          />
          <Legend />
          <Bar dataKey="entradas" fill="#10B981" radius={[8, 8, 0, 0]} />
          <Bar dataKey="saidas" fill="#EF4444" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PeriodChart;