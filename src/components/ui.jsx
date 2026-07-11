import React from "react";
import { SISTEMA_NOME, SISTEMA_LOGO } from "../lib/marca";

export function Brand({ size = "md" }) {
  const big = size === "lg";
  // separa a última palavra (ex: "OS") para destacar em mustard
  const partes = SISTEMA_NOME.trim().split(" ");
  const ultima = partes.length > 1 ? partes.pop() : "";
  const inicio = partes.join(" ");
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${big ? "w-11 h-11" : "w-9 h-9"} rounded-lg overflow-hidden grid place-items-center shadow-lg shadow-burnt/20 bg-coal shrink-0`}>
        <img src={SISTEMA_LOGO} alt={SISTEMA_NOME} className="w-full h-full object-cover" />
      </div>
      <div className="leading-none">
        <span className={`font-black tracking-tight ${big ? "text-2xl" : "text-lg"}`}>{inicio}</span>
        {ultima && <span className={`text-mustard font-black ${big ? "text-2xl" : "text-lg"}`}> {ultima}</span>}
      </div>
    </div>
  );
}

export function Spinner({ label = "Carregando..." }) {
  return (
    <div className="min-h-[60vh] grid place-items-center text-mut">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-graph border-t-mustard rounded-full animate-spin mx-auto mb-3" />
        <p className="font-bold text-sm">{label}</p>
      </div>
    </div>
  );
}

export function CenterMessage({ icon, titulo, texto, acao }) {
  return (
    <div className="max-w-md mx-auto px-4 min-h-[70vh] grid place-items-center text-center">
      <div>
        <div className="w-20 h-20 rounded-2xl bg-coal border border-graph grid place-items-center mx-auto mb-5">
          {icon}
        </div>
        <h2 className="font-black text-2xl mb-2">{titulo}</h2>
        <p className="text-mut mb-6">{texto}</p>
        {acao && (
          <button onClick={acao.onClick} className="px-6 py-3 rounded-xl bg-mustard text-ink font-black">
            {acao.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    recebido:  { label: "Recebido",     cls: "bg-graph text-cream" },
    producao:  { label: "Em produção",  cls: "bg-mustard text-ink" },
    pronto:    { label: "Pronto",       cls: "bg-burnt text-white" },
    concluido: { label: "Entregue",     cls: "bg-[#7BC96F] text-[#11200d]" },
  };
  const s = map[status] || map.recebido;
  return (
    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}
