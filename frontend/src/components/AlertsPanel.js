import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/transactions`);
      const transactions = response.data;
      
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      const upcomingAlerts = transactions
        .filter(t => {
          const transDate = new Date(t.date);
          return transDate > now && transDate <= threeDaysFromNow;
        })
        .map(t => ({
          id: t.id,
          message: `${t.type === "entrada" ? "💰" : "💳"} ${t.description} - R$ ${t.amount.toFixed(2)}`,
          date: new Date(t.date),
          type: t.type,
        }));

      setAlerts(upcomingAlerts);
    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
    }
  };

  const handleDismiss = (alertId) => {
    setDismissed([...dismissed, alertId]);
  };

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2" data-testid="alerts-panel">
      {visibleAlerts.map((alert) => {
        const daysUntil = Math.ceil((alert.date - new Date()) / (1000 * 60 * 60 * 24));
        
        return (
          <div
            key={alert.id}
            className="bg-card border border-border rounded-2xl p-4 shadow-lg max-w-sm animate-in slide-in-from-right"
            data-testid={`alert-${alert.id}`}
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {alert.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {daysUntil === 0
                    ? "Hoje"
                    : daysUntil === 1
                    ? "Amanhã"
                    : `Em ${daysUntil} dias`} - {alert.date.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full flex-shrink-0"
                onClick={() => handleDismiss(alert.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertsPanel;