import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TimelineView from "@/components/TimelineView.js";
import TransactionModal from "@/components/TransactionModal.js";
import FilterBar from "@/components/FilterBar.js";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Timeline = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "all",
    type: "all",
    dateFrom: "",
    dateTo: "",
  });

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/transactions`);
      setTransactions(response.data);
      setFilteredTransactions(response.data);
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
    applyFilters();
  }, [filters, transactions]);

  const applyFilters = () => {
    let filtered = [...transactions];

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
      await axios.post(`${API}/transactions`, data);
      toast.success("Transação criada com sucesso!");
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação");
    }
  };

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
            Timeline Financeiro
          </h2>
          <p className="text-muted-foreground mt-2">
            Visualize o fluxo completo dos próximos 30 dias
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <FilterBar onFilterChange={setFilters} activeFilters={filters} />
          <Button
            onClick={() => setModalOpen(true)}
            className="rounded-full px-6 py-6 shadow-lg hover:shadow-xl transition-all"
            data-testid="add-transaction-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      <TimelineView transactions={filteredTransactions} />

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTransaction}
      />
    </div>
  );
};

export default Timeline;