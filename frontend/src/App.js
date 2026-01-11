import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import WeekView from "@/pages/WeekView";
import MonthView from "@/pages/MonthView";
import YearView from "@/pages/YearView";
import "@/App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/semana" element={<WeekView />} />
            <Route path="/mes" element={<MonthView />} />
            <Route path="/ano" element={<YearView />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;