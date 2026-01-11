import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import WeeklyBalanceCard from "@/components/WeeklyBalanceCard.js";
import TipsPanel from "@/components/TipsPanel.js";
import TransactionsList from "@/components/TransactionsList.js";
import TransactionModal from "@/components/TransactionModal.js";
import PeriodChart from "@/components/PeriodChart.js";
import UpcomingTransactions from "@/components/UpcomingTransactions.js";
import TimelineView from "@/components/TimelineView.js";
import FilterBar from "@/components/FilterBar.js";
import AlertsPanel from "@/components/AlertsPanel.js";
import SearchBar from "@/components/SearchBar.js";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [weekStats, setWeekStats] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    type: "all",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const fetchData = async () => {
    try {
      const [transRes, statsRes] = await Promise.all([
        axios.get(`${API}/transactions`),
        axios.get(`${API}/stats/week`),
      ]);
      setTransactions(transRes.data);
      setFilteredTransactions(transRes.data);
      setWeekStats(statsRes.data);
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

  useEffect(() => {
    applyFiltersAndSearch();
  }, [filters, searchTerm, transactions]);

  const applyFiltersAndSearch = () => {
    let filtered = [...transactions];

    // Aplicar busca por texto
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros
    if (filters.type !== "all") {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.category !== "all") {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo));
    }

    setFilteredTransactions(filtered);
  };

  const handleSaveTransaction = async (data) => {
    try {
      if (editingTransaction) {
        await axios.put(`${API}/transactions/${editingTransaction.id}`, data);
        toast.success("Transação atualizada com sucesso!");
      } else {
        await axios.post(`${API}/transactions`, data);
        toast.success("Transação criada com sucesso!");
        
        // Notificação push
        if (Notification.permission === "granted") {
          new Notification("Transação criada!", {
            body: `${data.description} - R$ ${data.amount.toFixed(2)}`,
            icon: "/logo192.png"
          });
        }
      }
      setModalOpen(false);
      setEditingTransaction(null);
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação");
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await axios.delete(`${API}/transactions/${id}`);
      toast.success("Transação deletada com sucesso!");
      fetchData();
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
      toast.error("Erro ao deletar transação");
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => axios.delete(`${API}/transactions/${id}`)));
      toast.success(`${ids.length} transações deletadas com sucesso!`);
      fetchData();
    } catch (error) {
      console.error("Erro ao deletar transações:", error);
      toast.error("Erro ao deletar transações");
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const now = new Date();
  const currentFilteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= now);
  const recentTransactions = currentFilteredTransactions.slice(0, 5);

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
            Dashboard
          </h2>
          <p className="text-muted-foreground mt-2">Visão geral das suas finanças</p>
        </div>
        <div className="flex items-center space-x-3">
          <SearchBar onSearch={setSearchTerm} value={searchTerm} />
          <FilterBar onFilterChange={setFilters} activeFilters={filters} />
          <Button
            variant={bulkEditMode ? "default" : "outline"}
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className="rounded-full"
            data-testid="bulk-edit-toggle"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {bulkEditMode ? "Sair" : "Editar em lote"}
          </Button>
          <Button
            onClick={() => {
              setEditingTransaction(null);
              setModalOpen(true);
            }}
            className="rounded-full px-6 py-6 shadow-lg hover:shadow-xl transition-all"
            data-testid="add-transaction-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      <TimelineView transactions={filteredTransactions} />

      <UpcomingTransactions transactions={filteredTransactions} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyBalanceCard stats={weekStats} />
        </div>
        <div>
          <TipsPanel period="week" />
        </div>
      </div>

      <PeriodChart transactions={currentFilteredTransactions} />

      <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm">
        <h3 className="text-2xl font-display font-bold mb-6">
          Transações {bulkEditMode && "(Modo Edição)"}
        </h3>
        <TransactionsList
          transactions={recentTransactions}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          onBulkDelete={handleBulkDelete}
          showBulkActions={bulkEditMode}
        />
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
      />

      <AlertsPanel />
    </div>
  );
};

export default Dashboard;
