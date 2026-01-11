import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext.js";
import Layout from "@/components/Layout.js";
import Login from "@/pages/Login.js";
import Register from "@/pages/Register.js";
import Dashboard from "@/pages/Dashboard.js";
import WeekView from "@/pages/WeekView.js";
import MonthView from "@/pages/MonthView.js";
import YearView from "@/pages/YearView.js";
import Categories from "@/pages/Categories.js";
import Comparison from "@/pages/Comparison.js";
import Timeline from "@/pages/Timeline.js";
import "@/App.css";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return !user ? children : <Navigate to="/" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/semana" element={<WeekView />} />
                <Route path="/mes" element={<MonthView />} />
                <Route path="/ano" element={<YearView />} />
                <Route path="/categorias" element={<Categories />} />
                <Route path="/comparacao" element={<Comparison />} />
                <Route path="/timeline" element={<Timeline />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
