import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import ClientePage from "./components/ClientePage";
import PedidoPage from "./components/PedidoPage";
import AdminPage from "./components/AdminPage";
import AdminLogin, { isAdminAuthed } from "./components/AdminLogin";

function AdminGate() {
  const [authed, setAuthed] = useState(isAdminAuthed());
  return authed ? <AdminPage /> : <AdminLogin onOk={() => setAuthed(true)} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/cardapio"  element={<ClientePage />} />
        <Route path="/pedido/:id" element={<PedidoPage />} />
        <Route path="/admin"     element={<AdminGate />} />
        <Route path="*"          element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
