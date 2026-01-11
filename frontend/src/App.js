import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout.js";
import Dashboard from "@/pages/Dashboard.js";
import WeekView from "@/pages/WeekView.js";
import MonthView from "@/pages/MonthView.js";
import YearView from "@/pages/YearView.js";
import Categories from "@/pages/Categories.js";
import Comparison from "@/pages/Comparison.js";
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
            <Route path="/categorias" element={<Categories />} />
            <Route path="/comparacao" element={<Comparison />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;