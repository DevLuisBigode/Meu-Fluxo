import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PeriodStats from "@/components/PeriodStats.js";
import TransactionsList from "@/components/TransactionsList.js";
import TransactionModal from "@/components/TransactionModal.js";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WeekView = () => {
  const [stats, setStats] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/stats/week`);
      setStats(response.data);
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

  const handleSaveTransaction = async (data) => {
    try {
      if (editingTransaction) {
        await axios.put(`${API}/transactions/${editingTransaction.id}`, data);
        toast.success("Transação atualizada com sucesso!");
      } else {
        await axios.post(`${API}/transactions`, data);
        toast.success("Transação criada com sucesso!");
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

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
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
          <h2 className="text-4xl font-display font-bold tracking-tight">Visão Semanal</h2>
          <p className="text-muted-foreground mt-2">Suas transações desta semana</p>
        </div>
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

      {stats && <PeriodStats stats={stats} />}

      <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm">
        <h3 className="text-2xl font-display font-bold mb-6">Todas as Transações</h3>
        <TransactionsList
          transactions={stats?.transactions || []}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
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
    </div>
  );
};

export default WeekView;