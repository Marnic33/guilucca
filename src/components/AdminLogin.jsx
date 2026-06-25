import React, { useState } from "react";
import { Lock } from "lucide-react";
import { Brand } from "./ui";

const SESSION_KEY = "burgerflow_admin_ok";

export function isAdminAuthed() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AdminLogin({ onOk }) {
  const [pass, setPass] = useState("");
  const [erro, setErro] = useState("");
  const expected = import.meta.env.VITE_ADMIN_PASSWORD || "burgerflow";

  const entrar = () => {
    if (pass === expected) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
      onOk();
    } else {
      setErro("Senha incorreta.");
    }
  };

  return (
    <div className="min-h-screen bg-ink text-cream grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><Brand size="lg" /></div>
        <div className="bg-coal rounded-2xl border border-graph p-6">
          <div className="w-12 h-12 rounded-xl bg-graph grid place-items-center mx-auto mb-4">
            <Lock size={22} className="text-mustard" />
          </div>
          <h1 className="font-black text-xl text-center mb-1">Painel de Gestão</h1>
          <p className="text-mut text-sm text-center mb-5">Área restrita da equipe.</p>
          <input
            type="password"
            value={pass}
            autoFocus
            onChange={(e) => { setPass(e.target.value); setErro(""); }}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
            placeholder="Senha de acesso"
            className="w-full bg-ink rounded-xl px-4 py-3 border border-graph focus:border-mustard outline-none text-center font-bold mb-3"
          />
          {erro && <p className="text-burnt text-sm text-center mb-3 font-bold">{erro}</p>}
          <button
            onClick={entrar}
            className="w-full py-3 rounded-xl bg-mustard text-ink font-black active:scale-[0.99] transition"
          >
            Entrar
          </button>
        </div>
        <p className="text-center text-xs text-mut/60 mt-4">
          O link do cardápio é público. Este painel não.
        </p>
      </div>
    </div>
  );
}
