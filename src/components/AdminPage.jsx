import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Boxes, Truck, Plus, Minus, Trash2, Lock, Unlock, Check,
  ArrowLeft, Phone, Flame, Package, ClipboardList, TrendingUp,
  ListChecks, X, Printer, ShoppingBag, LogOut, Settings, Copy, Palette,
  Archive, History, ChevronDown, ChevronRight, Calendar, Wallet,
  Image as ImageIcon, Upload, Bell, MapPin, Clock, MessageCircle, CheckCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  listIngredients, addIngredient, deleteIngredient,
  listBurgers, saveBurger, deleteBurger, uploadFotoLanche, uploadLogo, uploadBanner,
  getBatchConfig, setBatchConfig,
  listOrders, updateOrderStatus, setItemEntregues,
  getSettings, saveSettings,
  listLotes, arquivarLote, setPagamentoStatus,
  aceitarPedido, recusarPedido, pedidoConta, deleteOrder, arquivarPedido,
  normalizarTelefoneWhats,
  listCategorias, addCategoria, deleteCategoria, entregarPedidoCompleto,
  listUnidades, addUnidade, deleteUnidade,
  calcShoppingList, calcBurgerCounts, totalLanchesPedidos, brl,
} from "../lib/api";
import { Brand, Spinner, StatusBadge } from "./ui";

const SESSION_KEY = "burgerflow_admin_ok";

const PAGAMENTO_LABEL = {
  pix: "PIX", dinheiro: "Dinheiro", credito: "Crédito", debito: "Débito",
};

export default function AdminPage() {
  const [tab, setTab] = useState("pedidos");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const reload = useCallback(async () => {
    try {
      const [ingredients, burgers, orders, config, settings, lotes, unidades, categorias] = await Promise.all([
        listIngredients(), listBurgers(), listOrders(), getBatchConfig(),
        getSettings().catch(() => null),
        listLotes().catch(() => []),
        listUnidades().catch(() => []),
        listCategorias().catch(() => []),
      ]);
      setData({ ingredients, burgers, orders, config, settings, lotes, unidades, categorias });
      setErro("");
    } catch (e) {
      setErro(
        "Não foi possível conectar ao banco de dados. Verifique as variáveis " +
        "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel e tente recarregar."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Realtime: novos pedidos aparecem no painel sem refresh
  useEffect(() => {
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "batch_config" }, reload)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [reload]);

  const sair = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    window.location.reload();
  };

  if (loading) return <div className="min-h-screen bg-ink"><Spinner label="Abrindo o painel..." /></div>;

  if (erro || !data) return (
    <div className="min-h-screen bg-ink text-cream grid place-items-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-coal border border-graph grid place-items-center mx-auto mb-4">
          <X size={28} className="text-burnt" />
        </div>
        <h2 className="font-black text-xl mb-2">Erro de conexão</h2>
        <p className="text-mut text-sm mb-5">{erro || "Dados indisponíveis."}</p>
        <button onClick={() => { setLoading(true); reload(); }} className="px-5 py-3 rounded-xl bg-mustard text-ink font-black">
          Tentar de novo
        </button>
      </div>
    </div>
  );

  const pendentesAprovacao = data.orders.filter((o) => o.status === "pendente").length;

  const tabs = [
    { id: "pedidos", label: "Pedidos", icon: <Bell size={18} />, badge: pendentesAprovacao },
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "faturamento", label: "Faturamento", icon: <TrendingUp size={18} /> },
    { id: "cozinha", label: "Cozinha", icon: <Truck size={18} /> },
    { id: "compras", label: "Compras", icon: <Boxes size={18} /> },
    { id: "cadastro", label: "Ficha Técnica", icon: <ClipboardList size={18} /> },
    { id: "historico", label: "Histórico", icon: <History size={18} /> },
    { id: "aparencia", label: "Aparência", icon: <Palette size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="sticky top-0 z-30 bg-ink/95 backdrop-blur border-b border-graph no-print">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Brand />
          <div className="flex items-center gap-2">
            <Link to="/" className="text-mut hover:text-cream text-sm font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-coal transition">
              <ShoppingBag size={15} /> Cardápio
            </Link>
            <button onClick={sair} className="text-mut hover:text-burnt text-sm font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-coal transition">
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pb-8 pt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1 no-print">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition ${
                tab === t.id ? "bg-mustard text-ink" : "bg-coal text-mut hover:text-cream border border-graph"
              }`}
            >
              {t.icon} {t.label}
              {t.badge > 0 && (
                <span className="ml-0.5 bg-burnt text-white text-xs font-black rounded-full min-w-5 h-5 px-1.5 grid place-items-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "pedidos" && <Aprovacao data={data} reload={reload} />}
        {tab === "dashboard" && <Dashboard data={data} reload={reload} />}
        {tab === "faturamento" && <Faturamento data={data} />}
        {tab === "cozinha" && <Cozinha data={data} reload={reload} />}
        {tab === "compras" && <Compras data={data} />}
        {tab === "cadastro" && <Cadastro data={data} reload={reload} />}
        {tab === "historico" && <Historico data={data} />}
        {tab === "aparencia" && <Aparencia data={data} reload={reload} />}
      </div>
    </div>
  );
}

/* ---------- DASHBOARD ----------------------------------------------------- */
function Dashboard({ data, reload }) {
  const { orders: allOrders, burgers, config, ingredients } = data;
  const orders = allOrders.filter(pedidoConta); // só pedidos aceitos contam
  const counts = useMemo(() => calcBurgerCounts(orders, burgers), [orders, burgers]);
  // entregues por lanche (soma das unidades dadas baixa)
  const entreguesPorLanche = useMemo(() => {
    const m = {};
    for (const o of orders)
      for (const it of o.order_items || [])
        m[it.burger_id] = (m[it.burger_id] || 0) + Math.min(it.entregues || 0, it.qtd);
    return m;
  }, [orders]);
  const faturamento = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalLanches = totalLanchesPedidos(orders);
  const maxCount = Math.max(1, ...counts.map((c) => c.total));
  const [copiado, setCopiado] = useState(false);
  const [confirmArq, setConfirmArq] = useState(false);
  const [arquivando, setArquivando] = useState(false);

  const toggleReceiving = async (open) => {
    await setBatchConfig({ receiving_open: open });
    reload();
  };

  const pendentes = orders.reduce(
    (s, o) => s + (o.order_items || []).filter((it) => !it.entregue).length, 0
  );

  const fazerArquivar = async () => {
    setArquivando(true);
    try {
      await arquivarLote({ orders, burgers, ingredients });
      setConfirmArq(false);
      reload();
    } catch (e) {
      alert("Erro ao arquivar: " + (e.message || "tente novamente"));
    } finally {
      setArquivando(false);
    }
  };

  const copiarLink = () => {
    navigator.clipboard?.writeText(window.location.origin + "/");
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Link de compartilhamento */}
      <div className="bg-gradient-to-br from-burnt to-ink rounded-2xl border border-mustard/20 p-5">
        <p className="font-black flex items-center gap-2 mb-1"><ShoppingBag size={18} className="text-mustard"/> Link do cardápio</p>
        <p className="text-sm text-cream/70 mb-3">Compartilhe este link com seus clientes. É público e seguro.</p>
        <div className="flex gap-2">
          <code className="flex-1 bg-ink/60 rounded-lg px-3 py-2.5 text-sm font-mono truncate border border-graph">
            {window.location.origin}/
          </code>
          <button onClick={copiarLink} className="px-4 py-2.5 rounded-lg bg-mustard text-ink font-black flex items-center gap-1.5 whitespace-nowrap">
            {copiado ? <><Check size={16}/> Copiado</> : <><Copy size={16}/> Copiar</>}
          </button>
        </div>
      </div>

      {/* Status do lote */}
      <div className={`rounded-2xl p-5 flex items-center justify-between gap-4 border ${
        config.receiving_open ? "bg-[#1c2a1a] border-[#3d5c34]" : "bg-[#2a1a18] border-[#5c342f]"
      }`}>
        <div className="flex items-center gap-3">
          {config.receiving_open ? <Unlock className="text-[#7BC96F]" size={24} /> : <Lock className="text-burnt" size={24} />}
          <div>
            <p className="font-black text-lg leading-tight">
              {config.receiving_open
                ? "Recebendo pedidos"
                : orders.length === 0 ? "Pronto para um novo lote" : "Lote fechado"}
            </p>
            <p className="text-sm text-mut">
              {config.receiving_open
                ? "Clientes podem enviar pedidos."
                : orders.length === 0
                  ? "Abra um novo lote quando quiser começar a receber pedidos."
                  : "Novos pedidos bloqueados."}
            </p>
          </div>
        </div>
        {config.receiving_open ? (
          <button onClick={() => toggleReceiving(false)} className="px-5 py-3 rounded-xl bg-burnt text-white font-black flex items-center gap-2 active:scale-95 transition whitespace-nowrap">
            <Lock size={18} /> Encerrar
          </button>
        ) : (
          <button onClick={() => toggleReceiving(true)} className={`px-5 py-3 rounded-xl font-black flex items-center gap-2 active:scale-95 transition whitespace-nowrap ${
            orders.length === 0 ? "bg-[#7BC96F] text-[#11200d]" : "bg-graph text-cream"
          }`}>
            <Unlock size={18} /> {orders.length === 0 ? "Abrir novo lote" : "Reabrir"}
          </button>
        )}
      </div>

      {/* Fechar e arquivar lote */}
      {orders.length > 0 && (
        <div className="bg-coal rounded-2xl border border-graph p-5">
          <div className="flex items-center gap-2 mb-1">
            <Archive size={18} className="text-mustard" />
            <span className="font-black">Fechar e arquivar lote</span>
          </div>
          <p className="text-sm text-mut mb-3">
            Salva este lote no histórico (faturamento, lanches, compras e todos os pedidos)
            e limpa a tela para começar o próximo lote do zero.
          </p>
          {!confirmArq ? (
            <button onClick={() => setConfirmArq(true)}
              className="w-full py-3 rounded-xl bg-graph hover:bg-mustard hover:text-ink font-bold flex items-center justify-center gap-2 transition">
              <Archive size={18} /> Fechar e arquivar lote atual
            </button>
          ) : (
            <div className="bg-[#2a1a18] border border-[#5c342f] rounded-xl p-4">
              {pendentes > 0 && (
                <p className="text-sm text-burnt font-bold mb-2">
                  ⚠ Atenção: ainda há {pendentes} {pendentes === 1 ? "item" : "itens"} não entregue(s) na cozinha.
                </p>
              )}
              <p className="text-sm text-cream mb-3">
                Confirma arquivar <strong>{orders.length}</strong> pedido(s),
                total <strong>{brl(faturamento)}</strong>? Isso limpa a tela atual.
                O lote fica salvo no Histórico.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmArq(false)} disabled={arquivando}
                  className="flex-1 py-2.5 rounded-xl bg-graph font-bold">Cancelar</button>
                <button onClick={fazerArquivar} disabled={arquivando}
                  className="flex-1 py-2.5 rounded-xl bg-burnt text-white font-black flex items-center justify-center gap-2 disabled:opacity-50">
                  {arquivando ? "Arquivando..." : <><Check size={16} /> Confirmar e arquivar</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Kpi icon={<ClipboardList size={20} />} label="Pedidos" valor={orders.length} />
        <Kpi icon={<Package size={20} />} label="Lanches" valor={totalLanches} />
        <Kpi icon={<TrendingUp size={20} />} label="Faturamento" valor={brl(faturamento)} destaque full />
      </div>

      {/* Ranking */}
      <div className="bg-coal rounded-2xl border border-graph p-5">
        <h3 className="font-black text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-mustard" /> Quantidade por lanche
        </h3>
        {counts.length === 0 ? (
          <p className="text-mut py-6 text-center">Nenhum pedido recebido ainda.</p>
        ) : (
          <div className="space-y-3">
            {counts.map((c) => {
              const feitos = entreguesPorLanche[c.id] || 0;
              const pct = c.total > 0 ? (feitos / c.total) * 100 : 0; // progresso do próprio lanche
              return (
              <div key={c.id}>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span>{c.emoji} {c.nome}</span>
                  <span className="text-mustard">{feitos} de {c.total} entregues</span>
                </div>
                <div className="h-3 rounded-full bg-ink overflow-hidden relative">
                  {/* barra de progresso: enche 100% quando todos entregues */}
                  <div className="h-full rounded-full bg-gradient-to-r from-mustard to-burnt transition-all"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

function CapacidadeCard({ config, usados, reload }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(config.capacidade || 0);
  const cap = config.capacidade || 0;

  const salvar = async () => {
    await setBatchConfig({ capacidade: Math.max(0, parseInt(val) || 0) });
    setEditing(false);
    reload();
  };

  return (
    <div className="bg-coal rounded-2xl border border-graph p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-mustard" />
          <span className="font-black">Capacidade do lote</span>
        </div>
        {!editing && (
          <button onClick={() => { setVal(cap); setEditing(true); }} className="text-sm font-bold text-mustard">
            Editar
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2 mt-3">
          <input type="number" value={val} onChange={(e) => setVal(e.target.value)}
            className="flex-1 bg-ink rounded-lg px-3 py-2 border border-graph focus:border-mustard outline-none font-bold"
            placeholder="0 = ilimitado" />
          <button onClick={salvar} className="px-4 py-2 rounded-lg bg-mustard text-ink font-black">Salvar</button>
          <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg bg-graph">Cancelar</button>
        </div>
      ) : (
        <p className="text-sm text-mut mt-1">
          {cap === 0
            ? "Ilimitado — sem trava de produção."
            : `${usados} de ${cap} lanches preenchidos. ${cap - usados > 0 ? `Restam ${cap - usados}.` : "Lote cheio."}`}
        </p>
      )}
    </div>
  );
}

function Kpi({ icon, label, valor, destaque, full }) {
  return (
    <div className={`rounded-2xl p-5 border ${full ? "col-span-2 sm:col-span-1" : ""} ${
      destaque ? "bg-gradient-to-br from-mustard to-burnt border-transparent text-ink" : "bg-coal border-graph"
    }`}>
      <div className={`mb-2 ${destaque ? "text-ink/70" : "text-mustard"}`}>{icon}</div>
      <p className={`text-3xl font-black leading-none ${destaque ? "" : "text-cream"}`}>{valor}</p>
      <p className={`text-sm font-bold mt-1 ${destaque ? "text-ink/70" : "text-mut"}`}>{label}</p>
    </div>
  );
}

/* ---------- COMPRAS (com exportar/imprimir) ------------------------------ */
function Compras({ data }) {
  const { orders, burgers, ingredients, config, settings } = data;
  const lista = useMemo(
    () => calcShoppingList(orders, burgers, ingredients),
    [orders, burgers, ingredients]
  );
  const lanches = useMemo(
    () => calcBurgerCounts(orders, burgers),
    [orders, burgers]
  );
  const [comprados, setComprados] = useState({}); // visual: ingredienteId -> true
  const [gerando, setGerando] = useState(false);

  const toggleComprado = (id) =>
    setComprados((c) => ({ ...c, [id]: !c[id] }));

  const totalLanches = totalLanchesPedidos(orders);
  const totalPedidos = orders.filter(pedidoConta).length;

  const baixarPdf = async () => {
    setGerando(true);
    try {
      await gerarPdfCompras({ lista, lanches, settings, totalLanches, totalPedidos });
    } catch (e) {
      alert("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap no-print">
        <h3 className="font-black text-xl flex items-center gap-2">
          <Boxes size={20} className="text-mustard" /> Lista final de insumos
        </h3>
        <button onClick={baixarPdf} disabled={gerando || lista.length === 0}
          className="px-4 py-2.5 rounded-xl bg-mustard text-ink font-black flex items-center gap-2 disabled:opacity-50">
          <Printer size={16} /> {gerando ? "Gerando..." : "Baixar PDF"}
        </button>
      </div>

      {config.receiving_open && (
        <div className="bg-[#2a2418] border border-[#5c4f2f] rounded-xl p-4 text-sm text-[#E8C977]">
          Prévia em tempo real. Feche o recebimento no Dashboard para consolidar o lote definitivo.
        </div>
      )}

      {/* Lanches a produzir */}
      {lanches.length > 0 && (
        <div className="bg-coal rounded-2xl border border-graph p-4">
          <p className="text-sm font-black text-mustard mb-3 flex items-center gap-2">
            <ClipboardList size={16} /> Lanches a produzir
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {lanches.map((b) => (
              <div key={b.id} className="flex items-center justify-between bg-ink rounded-lg px-3 py-2">
                <span className="font-bold text-sm">{b.emoji} {b.nome}</span>
                <span className="font-black text-mustard whitespace-nowrap">{b.total} un</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lista.length > 0 && (
        <p className="text-sm text-mut font-black flex items-center gap-2 mt-2">
          <Boxes size={16} className="text-mustard" /> Ingredientes para comprar
        </p>
      )}

      {lista.length === 0 ? (
        <p className="text-mut py-10 text-center bg-coal rounded-2xl border border-graph">
          Sem insumos — nenhum pedido aceito ainda.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {lista.map((item) => {
            const ok = comprados[item.id];
            return (
              <button key={item.id} onClick={() => toggleComprado(item.id)}
                className={`rounded-xl border p-4 flex items-center justify-between gap-3 text-left transition ${
                  ok ? "bg-[#1c2018] border-[#3d5c34]/50 opacity-60" : "bg-coal border-graph hover:border-mustard/40"
                }`}>
                <span className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-md grid place-items-center shrink-0 ${ok ? "bg-[#7BC96F] text-[#11200d]" : "bg-graph text-mut"}`}>
                    {ok && <Check size={15} />}
                  </span>
                  <span className={`font-bold ${ok ? "line-through" : ""}`}>{item.nome}</span>
                </span>
                <span className={`font-black text-xl whitespace-nowrap ${ok ? "text-mut line-through" : "text-mustard"}`}>
                  {item.qtd.toLocaleString("pt-BR")} {item.unidade}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Gera o PDF da lista de compras com logo, data e totais (carrega jsPDF via CDN). */
async function gerarPdfCompras({ lista, lanches, settings, totalLanches, totalPedidos }) {
  // carrega jsPDF sob demanda
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marca = settings?.marca || "BurgerFlow OS";

  let y = 18;

  // Logo (se houver) — carrega como dataURL
  if (settings?.logo_url) {
    try {
      const dataUrl = await urlParaDataUrl(settings.logo_url);
      doc.addImage(dataUrl, "JPEG", 15, y - 6, 18, 18);
    } catch (_) {}
  }

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(marca, settings?.logo_url ? 38 : 15, y);
  y += 7;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text("Lista de Produção e Compras", settings?.logo_url ? 38 : 15, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleString("pt-BR")}`, 15, y); y += 5;
  doc.text(`Pedidos: ${totalPedidos}   |   Lanches: ${totalLanches}`, 15, y); y += 8;

  doc.setDrawColor(200);
  doc.line(15, y, 195, y); y += 8;

  // ── Lanches a produzir ──
  if (lanches && lanches.length > 0) {
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text("Lanches a produzir", 15, y); y += 7;
    doc.setFontSize(12);
    lanches.forEach((b) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.setFont(undefined, "normal");
      doc.text(String(b.nome), 15, y);
      doc.setFont(undefined, "bold");
      doc.text(`${b.total} un`, 195, y, { align: "right" });
      y += 7;
    });
    y += 4;
    doc.setDrawColor(220);
    doc.line(15, y, 195, y); y += 8;
  }

  // ── Ingredientes ──
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Ingredientes para comprar", 15, y); y += 7;
  doc.setFontSize(12);
  lista.forEach((item) => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.setFont(undefined, "normal");
    doc.text(String(item.nome), 15, y);
    doc.setFont(undefined, "bold");
    doc.text(`${item.qtd.toLocaleString("pt-BR")} ${item.unidade}`, 195, y, { align: "right" });
    y += 7;
  });

  doc.save(`lista-compras-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function urlParaDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ---------- COZINHA ------------------------------------------------------- */
function Cozinha({ data, reload }) {
  const { orders, settings } = data;
  const pendentes = orders.filter((o) => o.status !== "concluido" && o.status !== "arquivado" && pedidoConta(o));
  const concluidos = orders.filter((o) => o.status === "concluido");

  // unidades ainda não entregues (para o resumo)
  const unidadesPendentes = pendentes.reduce(
    (s, o) => s + (o.order_items || []).reduce(
      (ss, it) => ss + Math.max(0, it.qtd - (it.entregues || 0)), 0
    ), 0
  );

  const baixarUnidade = async (orderId, itemId, novoValor) => {
    await setItemEntregues(orderId, itemId, novoValor);
    reload();
  };
  const reabrir = async (id) => { await updateOrderStatus(id, "recebido"); reload(); };
  const mudarPagamento = async (id, status) => { await setPagamentoStatus(id, status); reload(); };
  const excluir = async (id) => { await deleteOrder(id); reload(); };
  const arquivar = async (id) => { await arquivarPedido(id); reload(); };
  const entregarTudo = async (id) => { await entregarPedidoCompleto(id); reload(); };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-coal rounded-2xl border border-graph p-5">
          <p className="text-3xl font-black text-mustard">{pendentes.length}</p>
          <p className="text-sm font-bold text-mut mt-1">Pedidos na fila</p>
        </div>
        <div className="bg-coal rounded-2xl border border-graph p-5">
          <p className="text-3xl font-black text-burnt">{unidadesPendentes}</p>
          <p className="text-sm font-bold text-mut mt-1">Lanches a sair</p>
        </div>
        <div className="bg-coal rounded-2xl border border-graph p-5">
          <p className="text-3xl font-black text-[#7BC96F]">{concluidos.length}</p>
          <p className="text-sm font-bold text-mut mt-1">Concluídos</p>
        </div>
      </div>

      <div>
        <h3 className="font-black text-lg mb-3 flex items-center gap-2">
          <Flame size={18} className="text-burnt" /> Na fila ({pendentes.length})
        </h3>
        {pendentes.length === 0 ? (
          <p className="text-mut py-8 text-center bg-coal rounded-2xl border border-graph">
            Tudo entregue. Cozinha limpa! ✨
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {pendentes.map((o) => <Ticket key={o.id} order={o} settings={settings} baixarUnidade={baixarUnidade} mudarPagamento={mudarPagamento} excluir={excluir} arquivar={arquivar} entregarTudo={entregarTudo} />)}
          </div>
        )}
      </div>

      {concluidos.length > 0 && (
        <div>
          <h3 className="font-black text-lg mb-3 flex items-center gap-2">
            <Check size={18} className="text-[#7BC96F]" /> Concluídos ({concluidos.length})
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {concluidos.map((o) => <Ticket key={o.id} order={o} settings={settings} baixarUnidade={baixarUnidade} reabrir={reabrir} mudarPagamento={mudarPagamento} excluir={excluir} arquivar={arquivar} done />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Ticket({ order, settings, baixarUnidade, reabrir, mudarPagamento, excluir, arquivar, entregarTudo, done }) {
  const items = [...(order.order_items || [])].sort((a, b) =>
    String(a.id).localeCompare(String(b.id))
  );
  const totalUni = items.reduce((s, it) => s + it.qtd, 0);
  const feitasUni = items.reduce((s, it) => s + Math.min(it.entregues || 0, it.qtd), 0);
  const pagForma = PAGAMENTO_LABEL[order.pagamento_forma] || order.pagamento_forma || "—";
  const pagStatus = order.pagamento_status || "nao_pago";
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false);

  return (
    <div className={`rounded-2xl border p-4 transition ${done ? "bg-[#1c2018] border-[#3d5c34]/50" : "bg-coal border-graph"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-black text-lg leading-tight">{order.cliente}</p>
          <p className="text-xs text-mut flex items-center gap-1 mt-0.5"><Phone size={11} /> {order.telefone}</p>
          <p className="text-sm font-black text-mustard mt-0.5">{brl(order.total)}</p>
          {order.entrega_modo && order.entrega_modo !== "retirada" && order.entrega_texto && (
            <p className="text-xs text-cream flex items-start gap-1 mt-1 bg-ink rounded-lg p-1.5">
              <MapPin size={12} className="text-mustard shrink-0 mt-0.5" /> {order.entrega_texto}
            </p>
          )}
          {order.entrega_modo === "retirada" && (
            <p className="text-xs text-mut flex items-center gap-1 mt-1">
              <MapPin size={11} /> {order.entrega_texto || "Retirada no local"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <button
            onClick={() => setConfirmandoExcluir(true)}
            className="text-mut hover:text-burnt p-1 transition"
            title="Excluir pedido (duplicado/engano)"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Confirmação de exclusão */}
      {confirmandoExcluir && (
        <div className="bg-[#2a1a18] border border-[#5c342f] rounded-xl p-3 mb-3">
          <p className="text-sm text-cream font-bold mb-2">
            Excluir o pedido de {order.cliente}? Some de tudo (cozinha, faturamento e compras). Não dá pra desfazer.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmandoExcluir(false)}
              className="flex-1 py-2 rounded-lg bg-graph font-bold text-sm">Cancelar</button>
            <button onClick={() => excluir(order.id)}
              className="flex-1 py-2 rounded-lg bg-burnt text-white font-black text-sm flex items-center justify-center gap-1.5">
              <Trash2 size={14} /> Excluir de vez
            </button>
          </div>
        </div>
      )}

      {/* Pagamento */}
      <div className={`rounded-xl p-2.5 mb-3 border ${
        pagStatus === "pago" ? "bg-[#1c2a1a] border-[#3d5c34]"
        : pagStatus === "informado" ? "bg-[#2a2418] border-[#5c4f2f]"
        : "bg-ink border-graph"
      }`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold flex items-center gap-1.5">
            <Wallet size={14} className="text-mustard" /> {pagForma}
          </span>
          {pagStatus === "pago" ? (
            <span className="text-xs font-black text-[#7BC96F] flex items-center gap-1"><Check size={13} /> PAGO</span>
          ) : pagStatus === "informado" ? (
            <span className="text-xs font-black text-[#E8C977]">cliente avisou</span>
          ) : (
            <span className="text-xs font-bold text-mut">não pago</span>
          )}
        </div>
        {pagStatus !== "pago" ? (
          <button onClick={() => mudarPagamento(order.id, "pago")}
            className="w-full mt-2 py-2 rounded-lg bg-[#7BC96F] text-[#11200d] font-black text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
            <Check size={15} /> Confirmar pagamento
          </button>
        ) : (
          <button onClick={() => mudarPagamento(order.id, "nao_pago")}
            className="w-full mt-2 py-1.5 rounded-lg bg-graph text-mut hover:text-cream font-bold text-xs transition">
            Desfazer
          </button>
        )}
      </div>

      {!done && (
        <p className="text-xs text-mut mb-2 font-bold">{feitasUni} de {totalUni} lanches entregues</p>
      )}

      {/* Cada linha de item com baixa por unidade */}
      <ul className="space-y-2 mb-2">
        {items.map((it) => {
          const feitas = Math.min(it.entregues || 0, it.qtd);
          const completo = feitas >= it.qtd;
          return (
            <li key={it.id} className={`rounded-xl p-2.5 transition ${completo ? "bg-[#1c2018]" : "bg-ink"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className={`flex-1 ${completo ? "opacity-60" : ""}`}>
                  <span className="font-bold">
                    <span className="text-mustard">{it.qtd}x</span> {it.nome_lanche}
                  </span>
                  {(it.removidos || []).length > 0 && (
                    <span className="block text-xs text-burnt font-bold">sem: {(it.removidos || []).join(", ")}</span>
                  )}
                  {it.observacao && <span className="block text-xs text-mut italic">↳ {it.observacao}</span>}
                </div>
                {completo && <Check size={18} className="text-[#7BC96F] shrink-0" />}
              </div>

              {/* Controle por unidade: só aparece se a linha tem mais de 1, ou para marcar/desmarcar */}
              {!done && (
                <div className="flex items-center gap-2 mt-2">
                  {it.qtd > 1 ? (
                    <>
                      <button
                        onClick={() => baixarUnidade(order.id, it.id, feitas - 1)}
                        disabled={feitas === 0}
                        className="w-9 h-9 rounded-lg bg-graph text-cream grid place-items-center disabled:opacity-30 active:scale-95 transition"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="flex-1 text-center font-black text-sm">
                        {feitas} / {it.qtd} entregues
                      </span>
                      <button
                        onClick={() => baixarUnidade(order.id, it.id, feitas + 1)}
                        disabled={completo}
                        className="w-9 h-9 rounded-lg bg-[#7BC96F] text-[#11200d] grid place-items-center disabled:opacity-30 active:scale-95 transition"
                      >
                        <Plus size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => baixarUnidade(order.id, it.id, completo ? 0 : 1)}
                      className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                        completo ? "bg-graph text-mut" : "bg-[#7BC96F] text-[#11200d]"
                      }`}
                    >
                      <Check size={16} /> {completo ? "Desfazer" : "Dar baixa"}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Fechar o pedido inteiro de uma vez */}
      {!done && entregarTudo && (() => {
        const totalUnid = items.reduce((s, it) => s + it.qtd, 0);
        const feitasUnid = items.reduce((s, it) => s + Math.min(it.entregues || 0, it.qtd), 0);
        const faltam = totalUnid - feitasUnid;
        if (faltam <= 0) return null;
        return (
          <button
            onClick={() => {
              if (confirm(`Dar baixa em todos os ${faltam} lanche(s) restantes do pedido de ${order.cliente}?`)) {
                entregarTudo(order.id);
              }
            }}
            className="w-full mt-1 py-3 rounded-xl bg-[#7BC96F] text-[#11200d] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <CheckCheck size={18} /> Entregar tudo ({faltam} restante{faltam > 1 ? "s" : ""})
          </button>
        );
      })()}

      {done && (
        <div className="mt-1 space-y-2">
          {/* Avisar cliente via WhatsApp */}
          <button onClick={() => avisarClienteWhatsApp(order, settings)}
            className="w-full py-2.5 rounded-xl bg-[#25D366] text-[#0a3d1c] font-black flex items-center justify-center gap-2 transition active:scale-[0.98]">
            <MessageCircle size={16} /> Avisar cliente (WhatsApp)
          </button>
          <div className="flex gap-2">
            {reabrir && (
              <button onClick={() => reabrir(order.id)}
                className="flex-1 py-2.5 rounded-xl bg-graph text-mut hover:text-cream font-bold flex items-center justify-center gap-2 transition">
                <ArrowLeft size={16} /> Reabrir
              </button>
            )}
            {arquivar && (
              <button onClick={() => arquivar(order.id)}
                className="flex-1 py-2.5 rounded-xl bg-graph text-mut hover:text-cream font-bold flex items-center justify-center gap-2 transition">
                <Archive size={16} /> Arquivar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



/* ---------- FATURAMENTO --------------------------------------------------- */
function Faturamento({ data }) {
  const { orders } = data;

  // só pedidos com pagamento confirmado
  const pagos = orders.filter((o) => o.pagamento_status === "pago");

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  // agrega faturamento por dia (últimos 30 dias)
  const dias = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dias.push({ data: d, total: 0 });
  }
  const idxPorData = {};
  dias.forEach((d, i) => {
    idxPorData[d.data.toDateString()] = i;
  });

  let totalMes = 0;
  let totalAno = 0;
  let totalHoje = 0;
  const hojeStr = new Date(hoje).setHours(0, 0, 0, 0);

  for (const o of pagos) {
    const dt = new Date(o.created_at);
    const val = Number(o.total) || 0;
    // dia (últimos 30)
    const key = new Date(dt).toDateString();
    if (key in idxPorData) dias[idxPorData[key]].total += val;
    // mês atual
    if (dt.getMonth() === mesAtual && dt.getFullYear() === anoAtual) totalMes += val;
    // ano atual
    if (dt.getFullYear() === anoAtual) totalAno += val;
    // hoje
    if (new Date(dt).setHours(0, 0, 0, 0) === hojeStr) totalHoje += val;
  }

  const maxDia = Math.max(1, ...dias.map((d) => d.total));
  const totalPeriodo = dias.reduce((s, d) => s + d.total, 0);
  const diasComVenda = dias.filter((d) => d.total > 0).length;
  const mediaDia = diasComVenda > 0 ? totalPeriodo / diasComVenda : 0;

  const nomesMes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  const fmtDataCurta = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-black text-2xl">Faturamento</h2>
        <p className="text-sm text-mut mt-1">Apenas pedidos com pagamento confirmado.</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-coal rounded-2xl border border-graph p-4">
          <p className="text-xs font-bold text-mut uppercase tracking-wide">Hoje</p>
          <p className="text-xl font-black text-mustard mt-1">{brl(totalHoje)}</p>
        </div>
        <div className="bg-coal rounded-2xl border border-graph p-4">
          <p className="text-xs font-bold text-mut uppercase tracking-wide">Mês ({nomesMes[mesAtual]})</p>
          <p className="text-xl font-black text-mustard mt-1">{brl(totalMes)}</p>
        </div>
        <div className="bg-coal rounded-2xl border border-graph p-4">
          <p className="text-xs font-bold text-mut uppercase tracking-wide">Ano ({anoAtual})</p>
          <p className="text-xl font-black text-mustard mt-1">{brl(totalAno)}</p>
        </div>
      </div>

      {/* Gráfico de barras — últimos 30 dias */}
      <div className="bg-coal rounded-2xl border border-graph p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-black flex items-center gap-2">
            <TrendingUp size={18} className="text-mustard" /> Últimos 30 dias
          </h3>
          <div className="text-right">
            <p className="text-xs text-mut">Total no período</p>
            <p className="font-black text-mustard">{brl(totalPeriodo)}</p>
          </div>
        </div>

        {totalPeriodo === 0 ? (
          <p className="text-mut py-10 text-center">
            Nenhum pagamento confirmado nos últimos 30 dias ainda.
          </p>
        ) : (
          <>
            {/* barras */}
            <div className="flex items-end gap-1 h-48 border-b border-graph pb-0">
              {dias.map((d, i) => {
                const h = (d.total / maxDia) * 100;
                const temVenda = d.total > 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* tooltip */}
                    {temVenda && (
                      <div className="absolute -top-1 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 bg-ink border border-graph rounded-lg px-2 py-1 whitespace-nowrap">
                        <p className="text-[10px] text-mut">{fmtDataCurta(d.data)}</p>
                        <p className="text-xs font-black text-mustard">{brl(d.total)}</p>
                      </div>
                    )}
                    <div
                      className={`w-full rounded-t transition-all ${temVenda ? "bg-gradient-to-t from-burnt to-mustard" : "bg-graph/30"}`}
                      style={{ height: temVenda ? `${Math.max(4, h)}%` : "2px" }}
                    />
                  </div>
                );
              })}
            </div>
            {/* eixo de datas (a cada 5 dias) */}
            <div className="flex gap-1 mt-1.5">
              {dias.map((d, i) => (
                <div key={i} className="flex-1 text-center">
                  {i % 5 === 0 && (
                    <span className="text-[9px] text-mut">{fmtDataCurta(d.data)}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Estatísticas extras */}
      {totalPeriodo > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-coal rounded-2xl border border-graph p-4">
            <p className="text-xs font-bold text-mut uppercase tracking-wide">Média por dia com venda</p>
            <p className="text-lg font-black text-cream mt-1">{brl(mediaDia)}</p>
          </div>
          <div className="bg-coal rounded-2xl border border-graph p-4">
            <p className="text-xs font-bold text-mut uppercase tracking-wide">Dias com venda (30d)</p>
            <p className="text-lg font-black text-cream mt-1">{diasComVenda}</p>
          </div>
        </div>
      )}

      <div className="bg-[#2a2418] border border-[#5c4f2f] rounded-xl p-3 text-xs text-[#E8C977]">
        💡 Este painel mostra os pedidos que estão no sistema. Ao fechar e arquivar um lote, os pedidos vão para o Histórico — o faturamento total de cada lote fica registrado lá.
      </div>
    </div>
  );
}

/* ---------- CADASTRO ------------------------------------------------------ */
function Cadastro({ data, reload }) {
  const [sub, setSub] = useState("lanches");
  return (
    <div className="space-y-5">
      <div className="flex bg-coal rounded-xl p-1 border border-graph w-fit">
        {[{ id: "lanches", label: "Lanches" }, { id: "categorias", label: "Categorias" }, { id: "ingredientes", label: "Ingredientes" }].map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${sub === s.id ? "bg-mustard text-ink" : "text-mut"}`}>
            {s.label}
          </button>
        ))}
      </div>
      {sub === "ingredientes" ? <IngredientesCadastro data={data} reload={reload} />
        : sub === "categorias" ? <CategoriasCadastro data={data} reload={reload} />
        : <LanchesCadastro data={data} reload={reload} />}
    </div>
  );
}

/* ---------- CATEGORIAS (cadastro) ----------------------------------------- */
function CategoriasCadastro({ data, reload }) {
  const categorias = data.categorias || [];
  const burgers = data.burgers || [];
  const [nova, setNova] = useState("");
  const [salvando, setSalvando] = useState(false);

  const criar = async () => {
    if (!nova.trim()) return;
    setSalvando(true);
    try { await addCategoria(nova.trim()); setNova(""); reload(); }
    finally { setSalvando(false); }
  };

  const remover = async (c) => {
    const usados = burgers.filter((b) => b.categoria_id === c.id).length;
    const msg = usados > 0
      ? `Excluir "${c.nome}"? ${usados} produto(s) ficarão sem categoria.`
      : `Excluir a categoria "${c.nome}"?`;
    if (!confirm(msg)) return;
    await deleteCategoria(c.id);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="bg-coal rounded-2xl border border-graph p-5">
        <h3 className="font-black text-lg mb-1">Categorias do cardápio</h3>
        <p className="text-sm text-mut mb-4">
          Agrupe os produtos em seções (ex: Baguetes Salgadas, Baguetes Doces, Coxinhas).
          No cardápio, o cliente vê cada categoria como uma seção separada.
        </p>

        <div className="flex gap-2">
          <input
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && criar()}
            placeholder="Ex: Baguetes Salgadas"
            className="flex-1 bg-ink rounded-xl px-4 py-3 border border-graph outline-none focus:border-mustard text-sm"
          />
          <button onClick={criar} disabled={!nova.trim() || salvando}
            className="px-5 py-3 rounded-xl bg-mustard text-ink font-black disabled:opacity-40 flex items-center gap-2">
            <Plus size={18} /> Criar
          </button>
        </div>
      </div>

      {categorias.length === 0 ? (
        <p className="text-mut text-center py-8">
          Nenhuma categoria ainda. Sem categorias, todos os produtos aparecem numa lista única.
        </p>
      ) : (
        <div className="space-y-2">
          {categorias.map((c) => {
            const qtd = burgers.filter((b) => b.categoria_id === c.id).length;
            return (
              <div key={c.id} className="bg-coal rounded-xl border border-graph p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-black">{c.nome}</p>
                  <p className="text-xs text-mut mt-0.5">
                    {qtd === 0 ? "Nenhum produto" : `${qtd} produto${qtd > 1 ? "s" : ""}`}
                  </p>
                </div>
                <button onClick={() => remover(c)}
                  className="p-2 rounded-lg text-mut hover:text-burnt hover:bg-ink transition">
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IngredientesCadastro({ data, reload }) {
  const { ingredients } = data;
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("un");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!nome.trim()) return;
    setBusy(true);
    await addIngredient(nome.trim(), unidade);
    setNome(""); setBusy(false); reload();
  };
  const remover = async (id) => { await deleteIngredient(id); reload(); };

  return (
    <div className="space-y-4">
      <div className="bg-coal rounded-2xl border border-graph p-5 space-y-3">
        <h3 className="font-black flex items-center gap-2"><Plus size={18} className="text-mustard" /> Novo ingrediente base</h3>
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Queijo Prato"
            className="bg-ink rounded-xl px-4 py-3 border border-graph outline-none focus:border-mustard text-sm" />
          <select value={unidade} onChange={(e) => setUnidade(e.target.value)}
            className="bg-ink rounded-xl px-4 py-3 border border-graph outline-none focus:border-mustard text-sm font-bold">
            <option value="un">unidade</option>
            <option value="g">gramas (g)</option>
            <option value="ml">mililitros (ml)</option>
            <option value="kg">quilos (kg)</option>
            <option value="l">litros (l)</option>
          </select>
          <button onClick={add} disabled={busy} className="px-5 py-3 rounded-xl bg-mustard text-ink font-black disabled:opacity-50">
            Adicionar
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {ingredients.map((i) => (
          <div key={i.id} className="bg-coal rounded-xl border border-graph p-4 flex items-center justify-between">
            <div>
              <p className="font-bold">{i.nome}</p>
              <p className="text-xs text-mut">medido em {i.unidade}</p>
            </div>
            <button onClick={() => remover(i.id)} className="text-mut hover:text-burnt p-2"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LanchesCadastro({ data, reload }) {
  const { burgers, ingredients } = data;
  const categorias = data.categorias || [];
  const [editing, setEditing] = useState(null);

  const novo = () => setEditing({ id: null, nome: "", descricao: "", preco: "", emoji: "🍔", ficha: [], permite_personalizar: true, qtd_maxima: null, estoque: null, categoria_id: null, _isNew: true });

  const salvar = async (burger) => { await saveBurger(burger); setEditing(null); reload(); };
  const remover = async (id) => { await deleteBurger(id); reload(); };

  if (editing) {
    return <LancheForm burger={editing} ingredients={ingredients} categorias={categorias} onSave={salvar} onCancel={() => setEditing(null)} />;
  }

  return (
    <div className="space-y-4">
      <button onClick={novo}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-graph text-mut hover:border-mustard hover:text-mustard font-bold flex items-center justify-center gap-2 transition">
        <Plus size={20} /> Cadastrar novo lanche
      </button>
      <div className="space-y-3">
        {burgers.map((b) => (
          <div key={b.id} className="bg-coal rounded-2xl border border-graph p-4">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl bg-ink overflow-hidden grid place-items-center shrink-0">
                {b.foto_url
                  ? <img src={b.foto_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-3xl">{b.emoji}</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-black text-lg">{b.nome}</h4>
                  <span className="font-black text-mustard">{brl(b.preco)}</span>
                </div>
                <p className="text-sm text-mut mt-0.5">{b.descricao}</p>
                <div className="flex items-center gap-3 flex-wrap mt-2">
                  <p className="text-xs text-mut/70 flex items-center gap-1"><ListChecks size={13} /> {b.ficha.length} ingrediente(s)</p>
                  {(() => {
                    const cat = categorias.find((c) => c.id === b.categoria_id);
                    return cat ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-ink border border-graph text-cream">{cat.nome}</span>
                    ) : null;
                  })()}
                  {b.estoque !== null && b.estoque !== undefined && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-ink border border-graph text-mustard">
                      estoque: {b.estoque}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditing({ ...b, _isNew: false })}
                className="flex-1 py-2.5 rounded-xl bg-graph hover:bg-mustard hover:text-ink font-bold text-sm transition">
                Editar ficha
              </button>
              <button onClick={() => remover(b.id)} className="px-4 py-2.5 rounded-xl bg-graph text-mut hover:text-burnt transition">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LancheForm({ burger, ingredients, categorias = [], onSave, onCancel }) {
  const [form, setForm] = useState(burger);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addFicha = () => set("ficha", [...form.ficha, { ingredienteId: ingredients[0]?.id || "", qtd: 1 }]);
  const updFicha = (i, k, v) => set("ficha", form.ficha.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)));
  const rmFicha = (i) => set("ficha", form.ficha.filter((_, idx) => idx !== i));

  const emojis = ["🍔", "🥓", "🧀", "🥗", "🌶️", "🔥", "🐔", "🥬"];
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState("");

  const escolherFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviandoFoto(true);
    setErroFoto("");
    try {
      const url = await uploadFotoLanche(file);
      set("foto_url", url);
    } catch (err) {
      setErroFoto("Não foi possível enviar a foto. Verifique se o bucket 'lanches' foi criado no Supabase.");
    } finally {
      setEnviandoFoto(false);
      e.target.value = "";
    }
  };

  const salvar = async () => { setBusy(true); await onSave(form); };

  return (
    <div className="bg-coal rounded-2xl border border-graph p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-lg">{form._isNew ? "Novo lanche" : "Editar lanche"}</h3>
        <button onClick={onCancel} className="text-mut hover:text-cream p-1"><X size={20} /></button>
      </div>

      {/* Foto do lanche */}
      <div>
        <label className="text-xs font-bold text-mut mb-2 block uppercase tracking-wide flex items-center gap-1.5">
          <ImageIcon size={14} /> Foto do lanche
        </label>
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-xl bg-ink border border-graph overflow-hidden grid place-items-center shrink-0">
            {form.foto_url
              ? <img src={form.foto_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-3xl">{form.emoji}</span>}
          </div>
          <div className="flex-1 space-y-2">
            <label className="block">
              <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition ${
                enviandoFoto ? "bg-graph text-mut" : "bg-graph hover:bg-mustard hover:text-ink"
              }`}>
                <Upload size={15} /> {enviandoFoto ? "Enviando..." : form.foto_url ? "Trocar foto" : "Enviar foto"}
              </span>
              <input type="file" accept="image/*" onChange={escolherFoto} disabled={enviandoFoto} className="hidden" />
            </label>
            {form.foto_url && (
              <button onClick={() => set("foto_url", null)} className="block text-xs font-bold text-mut hover:text-burnt">
                Remover foto (usar emoji)
              </button>
            )}
          </div>
        </div>
        {erroFoto && <p className="text-xs text-burnt mt-2 font-bold">{erroFoto}</p>}
        <p className="text-[11px] text-mut/60 mt-2">A foto é recortada em quadrado e comprimida automaticamente.</p>
      </div>

      {/* Emoji (reserva, usado quando não há foto) */}
      <div>
        <label className="text-xs font-bold text-mut mb-2 block uppercase tracking-wide">Emoji (usado se não houver foto)</label>
        <div className="flex gap-1.5 flex-wrap">
          {emojis.map((e) => (
            <button key={e} onClick={() => set("emoji", e)}
              className={`w-11 h-11 rounded-xl text-2xl grid place-items-center transition ${form.emoji === e ? "bg-mustard" : "bg-ink hover:bg-graph"}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <LabeledInput label="Nome do lanche" value={form.nome} onChange={(v) => set("nome", v)} placeholder="Ex: X-Tudo" />
        <LabeledInput label="Preço de venda (R$)" value={form.preco} onChange={(v) => set("preco", v)} placeholder="0.00" type="number" />
      </div>
      <div>
        <label className="text-xs font-bold text-mut mb-1.5 block uppercase tracking-wide">Descrição</label>
        <textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={2}
          placeholder="Ingredientes e diferenciais..." 
          className="w-full bg-ink rounded-xl px-4 py-3 border border-graph outline-none focus:border-mustard text-sm resize-none" />
      </div>

      {/* Permitir personalização */}
      <label className="flex items-center justify-between gap-3 cursor-pointer bg-ink rounded-xl p-3 border border-graph">
        <div>
          <p className="font-bold text-sm">Permitir o cliente personalizar</p>
          <p className="text-xs text-mut">Se ligado, o cliente pode tirar ingredientes (ex: hambúrguer). Se desligado, só mostra os ingredientes (ex: baguete).</p>
        </div>
        <button
          type="button"
          onClick={() => set("permite_personalizar", form.permite_personalizar === false ? true : false)}
          className={`w-12 h-7 rounded-full p-1 transition shrink-0 ${form.permite_personalizar !== false ? "bg-[#7BC96F]" : "bg-graph"}`}
        >
          <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${form.permite_personalizar !== false ? "translate-x-5" : ""}`} />
        </button>
      </label>

      {/* Categoria */}
      <div className="bg-ink rounded-xl p-3 border border-graph">
        <label className="text-xs font-bold text-mut mb-1.5 block uppercase tracking-wide">
          Categoria
        </label>
        <select
          value={form.categoria_id || ""}
          onChange={(e) => set("categoria_id", e.target.value || null)}
          className="w-full bg-coal rounded-lg px-4 py-2.5 border border-graph outline-none focus:border-mustard text-sm"
        >
          <option value="">Sem categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <p className="text-[11px] text-mut/60 mt-1.5">
          {categorias.length === 0
            ? 'Nenhuma categoria criada ainda. Vá em Cadastro → Categorias para criar.'
            : "No cardápio, os produtos aparecem agrupados por categoria."}
        </p>
      </div>

      {/* Estoque disponível */}
      <div className="bg-ink rounded-xl p-3 border border-graph">
        <label className="text-xs font-bold text-mut mb-1.5 block uppercase tracking-wide">
          Estoque disponível (deixe vazio = ilimitado)
        </label>
        <input
          type="number"
          min="0"
          value={form.estoque === null || form.estoque === undefined ? "" : form.estoque}
          onChange={(e) => set("estoque", e.target.value === "" ? null : Number(e.target.value))}
          placeholder="Ex: 20"
          className="w-full bg-coal rounded-lg px-4 py-2.5 border border-graph outline-none focus:border-mustard text-sm"
        />
        <p className="text-[11px] text-mut/60 mt-1.5">
          Quantas unidades deste produto estão disponíveis. O cardápio mostra "restam X" e esgota quando chega a zero.
        </p>
      </div>

      {/* Quantidade máxima por pedido */}
      <div className="bg-ink rounded-xl p-3 border border-graph">
        <label className="text-xs font-bold text-mut mb-1.5 block uppercase tracking-wide">
          Quantidade máxima por pedido (deixe vazio = sem limite)
        </label>
        <input
          type="number"
          min="1"
          value={form.qtd_maxima || ""}
          onChange={(e) => set("qtd_maxima", e.target.value ? Number(e.target.value) : null)}
          placeholder="Ex: 10"
          className="w-full bg-coal rounded-lg px-4 py-2.5 border border-graph outline-none focus:border-mustard text-sm"
        />
        <p className="text-[11px] text-mut/60 mt-1.5">
          O cliente não consegue adicionar mais do que esse número de unidades deste produto num pedido.
        </p>
      </div>

      <div className="border-t border-graph pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-black flex items-center gap-2"><ListChecks size={18} className="text-mustard" /> Ficha técnica</h4>
          <button onClick={addFicha} disabled={ingredients.length === 0}
            className="text-sm font-bold text-mustard flex items-center gap-1 disabled:opacity-40">
            <Plus size={16} /> Ingrediente
          </button>
        </div>
        {ingredients.length === 0 && (
          <p className="text-sm text-mut bg-ink rounded-xl p-3">Cadastre ingredientes base primeiro.</p>
        )}
        <div className="space-y-2">
          {form.ficha.map((f, i) => {
            const ing = ingredients.find((x) => x.id === f.ingredienteId);
            return (
              <div key={i} className="flex gap-2 items-center bg-ink rounded-xl p-2">
                <select value={f.ingredienteId} onChange={(e) => updFicha(i, "ingredienteId", e.target.value)}
                  className="flex-1 bg-coal rounded-lg px-3 py-2.5 border border-graph outline-none focus:border-mustard text-sm">
                  {ingredients.map((ig) => <option key={ig.id} value={ig.id}>{ig.nome}</option>)}
                </select>
                <input type="number" value={f.qtd} onChange={(e) => updFicha(i, "qtd", parseFloat(e.target.value) || 0)}
                  className="w-20 bg-coal rounded-lg px-3 py-2.5 border border-graph outline-none focus:border-mustard text-sm text-center font-bold" />
                <span className="text-xs text-mut w-7 font-bold">{ing?.unidade}</span>
                <button onClick={() => rmFicha(i)} className="text-mut hover:text-burnt p-1.5"><Trash2 size={16} /></button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-graph font-bold">Cancelar</button>
        <button onClick={salvar} disabled={!form.nome.trim() || busy}
          className="flex-1 py-3 rounded-xl bg-mustard text-ink font-black disabled:opacity-40">
          {busy ? "Salvando..." : "Salvar lanche"}
        </button>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-bold text-mut mb-1.5 block uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-ink rounded-xl px-4 py-3 border border-graph outline-none focus:border-mustard text-sm" />
    </div>
  );
}

function ToggleRow({ titulo, sub, on, onToggle }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <div>
        <p className="font-bold">{titulo}</p>
        <p className="text-xs text-mut">{sub}</p>
      </div>
      <button type="button" onClick={onToggle}
        className={`w-12 h-7 rounded-full p-1 transition shrink-0 ${on ? "bg-[#7BC96F]" : "bg-graph"}`}>
        <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

/* Campo de texto multilinha para editar uma mensagem. */
function MsgField({ label, hint, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-bold text-mut mb-1 block uppercase tracking-wide">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full bg-ink rounded-xl px-4 py-3 border border-graph outline-none focus:border-mustard text-sm resize-y font-mono leading-relaxed"
      />
      {hint && <p className="text-[11px] text-mut/60 mt-1">{hint}</p>}
    </div>
  );
}

/* Formata "2026-07-10" como "10/07 (sex)" */
function formatarDataBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")} (${dias[dt.getDay()]})`;
}

/* ---------- APARÊNCIA (marca + textos do cardápio) ----------------------- */
function Aparencia({ data, reload }) {
  const s = data.settings || {};
  const [marca, setMarca] = useState(s.marca || "BurgerFlow OS");
  const [titulo, setTitulo] = useState(s.banner_titulo || "");
  const [selo, setSelo] = useState(s.banner_selo || "Lote aberto agora");
  const [msgAceite, setMsgAceite] = useState(s.msg_aceite || "");
  const [msgRecusa, setMsgRecusa] = useState(s.msg_recusa || "");
  const [msgPronto, setMsgPronto] = useState(s.msg_pronto || "");
  const [msgAguardando, setMsgAguardando] = useState(s.msg_aguardando || "");
  const [motivosRecusa, setMotivosRecusa] = useState(s.motivos_recusa || []);
  const [novoMotivo, setNovoMotivo] = useState("");
  const [sub, setSub] = useState(s.banner_sub || "");
  const [logoUrl, setLogoUrl] = useState(s.logo_url || null);
  const [bannerUrl, setBannerUrl] = useState(s.banner_url || null);
  const [pixChave, setPixChave] = useState(s.pix_chave || "");
  const [pixNome, setPixNome] = useState(s.pix_nome || "");
  const [somentePix, setSomentePix] = useState(!!s.somente_pix);
  const [entRetirada, setEntRetirada] = useState(s.entrega_retirada !== false);
  const [entEndereco, setEntEndereco] = useState(!!s.entrega_endereco);
  const [entUnidade, setEntUnidade] = useState(!!s.entrega_unidade);
  const [novaUnidade, setNovaUnidade] = useState("");
  const [horariosRetirada, setHorariosRetirada] = useState(s.horarios_retirada || []);
  const [novoHorario, setNovoHorario] = useState("");
  const [datasDisponiveis, setDatasDisponiveis] = useState(s.datas_disponiveis || []);
  const [novaData, setNovaData] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoBanner, setEnviandoBanner] = useState(false);
  const [erroLogo, setErroLogo] = useState("");

  const semSettings = !data.settings;

  const addUnidadeHandler = async () => {
    if (!novaUnidade.trim()) return;
    await addUnidade(novaUnidade.trim());
    setNovaUnidade("");
    reload();
  };
  const removerUnidade = async (id) => { await deleteUnidade(id); reload(); };

  const escolherLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviandoLogo(true);
    setErroLogo("");
    try {
      const url = await uploadLogo(file);
      setLogoUrl(url);
    } catch (err) {
      setErroLogo("Não foi possível enviar o logo. Verifique se o bucket 'logos' foi criado no Supabase.");
    } finally {
      setEnviandoLogo(false);
      e.target.value = "";
    }
  };

  const escolherBanner = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviandoBanner(true);
    setErroLogo("");
    try {
      const url = await uploadBanner(file);
      setBannerUrl(url);
    } catch (err) {
      setErroLogo("Não foi possível enviar a imagem de fundo.");
    } finally {
      setEnviandoBanner(false);
      e.target.value = "";
    }
  };

  const salvar = async () => {
    setBusy(true);
    try {
      await saveSettings({
        marca, banner_titulo: titulo, banner_sub: sub, banner_selo: selo,
        msg_aceite: msgAceite, msg_recusa: msgRecusa, msg_pronto: msgPronto,
        msg_aguardando: msgAguardando, motivos_recusa: motivosRecusa,
        logo_url: logoUrl, banner_url: bannerUrl,
        pix_chave: pixChave, pix_nome: pixNome,
        somente_pix: somentePix,
        entrega_retirada: entRetirada,
        entrega_endereco: entEndereco,
        entrega_unidade: entUnidade,
        horarios_retirada: horariosRetirada,
        datas_disponiveis: datasDisponiveis,
      });
      setOk(true);
      setTimeout(() => setOk(false), 2500);
      reload();
    } finally {
      setBusy(false);
    }
  };

  if (semSettings) {
    return (
      <div className="bg-[#2a1a18] border border-[#5c342f] rounded-2xl p-5">
        <h3 className="font-black text-lg mb-2 flex items-center gap-2">
          <Palette size={18} className="text-burnt" /> Configuração pendente
        </h3>
        <p className="text-sm text-mut mb-3">
          A tabela de personalização ainda não existe no banco. Rode a migração
          <code className="bg-ink px-1.5 py-0.5 rounded mx-1">migracao_v2.sql</code>
          no SQL Editor do Supabase e recarregue esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Logo + identidade */}
      <div className="bg-coal rounded-2xl border border-graph p-5 space-y-4">
        <h3 className="font-black text-lg flex items-center gap-2">
          <Palette size={18} className="text-mustard" /> Identidade da loja
        </h3>

        {/* Logo */}
        <div>
          <label className="text-xs font-bold text-mut mb-2 block uppercase tracking-wide flex items-center gap-1.5">
            <ImageIcon size={14} /> Logo da loja
          </label>
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-xl bg-ink border border-graph overflow-hidden grid place-items-center shrink-0">
              {logoUrl
                ? <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                : <ImageIcon size={28} className="text-mut" />}
            </div>
            <div className="flex-1 space-y-2">
              <label className="block">
                <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition ${
                  enviandoLogo ? "bg-graph text-mut" : "bg-graph hover:bg-mustard hover:text-ink"
                }`}>
                  <Upload size={15} /> {enviandoLogo ? "Enviando..." : logoUrl ? "Trocar logo" : "Enviar logo"}
                </span>
                <input type="file" accept="image/*" onChange={escolherLogo} disabled={enviandoLogo} className="hidden" />
              </label>
              {logoUrl && (
                <button onClick={() => setLogoUrl(null)} className="block text-xs font-bold text-mut hover:text-burnt">
                  Remover logo
                </button>
              )}
            </div>
          </div>
          {erroLogo && <p className="text-xs text-burnt mt-2 font-bold">{erroLogo}</p>}
        </div>

        {/* Imagem de fundo do banner */}
        <div>
          <label className="text-xs font-bold text-mut mb-2 block uppercase tracking-wide flex items-center gap-1.5">
            <ImageIcon size={14} /> Imagem de fundo do banner
          </label>
          <div className="flex items-center gap-3">
            <div className="w-28 h-16 rounded-xl bg-ink border border-graph overflow-hidden grid place-items-center shrink-0">
              {bannerUrl
                ? <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
                : <ImageIcon size={24} className="text-mut" />}
            </div>
            <div className="flex-1 space-y-2">
              <label className="block">
                <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition ${
                  enviandoBanner ? "bg-graph text-mut" : "bg-graph hover:bg-mustard hover:text-ink"
                }`}>
                  <Upload size={15} /> {enviandoBanner ? "Enviando..." : bannerUrl ? "Trocar fundo" : "Enviar fundo"}
                </span>
                <input type="file" accept="image/*" onChange={escolherBanner} disabled={enviandoBanner} className="hidden" />
              </label>
              {bannerUrl && (
                <button onClick={() => setBannerUrl(null)} className="block text-xs font-bold text-mut hover:text-burnt">
                  Remover fundo
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-mut/60 mt-2">O texto do banner aparece por cima, com um escurecimento para manter a leitura.</p>
        </div>

        <LabeledInput label="Nome da loja / marca" value={marca} onChange={setMarca} placeholder="Ex: Baguetes do João" />

        <LabeledInput label="Selo do banner (etiqueta amarela)" value={selo} onChange={setSelo} placeholder="Ex: Lote aberto agora / Pedidos abertos" />

        <div>
          <label className="text-xs font-bold text-mut mb-1.5 block uppercase tracking-wide">Título do banner</label>
          <textarea value={titulo} onChange={(e) => setTitulo(e.target.value)} rows={2}
            placeholder="Faça seu pedido. A gente caprichou."
            className="w-full bg-ink rounded-xl px-4 py-3 border border-graph outline-none focus:border-mustard text-sm resize-none" />
        </div>

        <div>
          <label className="text-xs font-bold text-mut mb-1.5 block uppercase tracking-wide">Subtítulo / recado (pode usar várias linhas)</label>
          <textarea value={sub} onChange={(e) => setSub(e.target.value)} rows={4}
            placeholder={"Escolha seus itens e envie.\nEntregas a partir das 12h.\nPagamento via PIX."}
            className="w-full bg-ink rounded-xl px-4 py-3 border border-graph outline-none focus:border-mustard text-sm resize-none" />
        </div>
      </div>

      {/* Pagamento */}
      <div className="bg-coal rounded-2xl border border-graph p-5 space-y-4">
        <h3 className="font-black text-lg flex items-center gap-2">
          <Wallet size={18} className="text-mustard" /> Pagamento
        </h3>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <p className="font-bold">Aceitar somente PIX</p>
            <p className="text-xs text-mut">Esconde as outras formas. O cliente vê só PIX no checkout.</p>
          </div>
          <button
            type="button"
            onClick={() => setSomentePix((v) => !v)}
            className={`w-12 h-7 rounded-full p-1 transition shrink-0 ${somentePix ? "bg-[#7BC96F]" : "bg-graph"}`}
          >
            <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${somentePix ? "translate-x-5" : ""}`} />
          </button>
        </label>

        <div className="border-t border-graph pt-4 space-y-3">
          <LabeledInput label="Chave PIX (aparece pro cliente copiar)" value={pixChave} onChange={setPixChave} placeholder="CPF, e-mail, telefone ou chave aleatória" />
          <LabeledInput label="Nome do recebedor (opcional)" value={pixNome} onChange={setPixNome} placeholder="Ex: João da Silva" />
          {!pixChave && (
            <p className="text-xs text-[#E8C977]">Sem a chave PIX preenchida, o cliente não vê para onde transferir.</p>
          )}
        </div>
      </div>

      {/* Entrega */}
      <div className="bg-coal rounded-2xl border border-graph p-5 space-y-4">
        <h3 className="font-black text-lg flex items-center gap-2">
          <MapPin size={18} className="text-mustard" /> Entrega e Agenda
        </h3>
        <p className="text-sm text-mut">Escolha as opções que o cliente pode usar ao pedir. Se marcar mais de uma, ele seleciona no checkout.</p>

        {/* Agenda: datas + horários (valem para retirada E entrega) */}
        <div className="bg-ink rounded-xl p-3 border border-graph space-y-4">
          {/* Datas disponíveis */}
          <div>
            <p className="text-xs font-bold text-mut mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar size={13} /> Datas disponíveis para pedido
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
                className="flex-1 bg-coal rounded-lg px-3 py-2 border border-graph outline-none focus:border-mustard text-sm"
              />
              <button
                onClick={() => {
                  if (novaData && !datasDisponiveis.includes(novaData)) {
                    setDatasDisponiveis((d) => [...d, novaData].sort());
                    setNovaData("");
                  }
                }}
                className="px-3 py-2 rounded-lg bg-mustard text-ink font-black text-sm"
              >
                +
              </button>
            </div>
            {datasDisponiveis.length === 0 ? (
              <p className="text-[11px] text-mut/60">Nenhuma data cadastrada — o cliente não verá seletor de data.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {datasDisponiveis.map((d, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-coal rounded-lg px-3 py-1.5 text-sm font-bold border border-graph">
                    {formatarDataBR(d)}
                    <button onClick={() => setDatasDisponiveis((arr) => arr.filter((_, j) => j !== i))}
                      className="text-mut hover:text-burnt ml-1">
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Horários disponíveis */}
          <div className="border-t border-graph pt-3">
            <p className="text-xs font-bold text-mut mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <Clock size={13} /> Horários disponíveis
            </p>
            <div className="flex gap-2 mb-2">
              <input
                value={novoHorario}
                onChange={(e) => setNovoHorario(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && novoHorario.trim()) {
                    setHorariosRetirada((h) => [...h, novoHorario.trim()]);
                    setNovoHorario("");
                  }
                }}
                placeholder="Ex: 12h00"
                className="flex-1 bg-coal rounded-lg px-3 py-2 border border-graph outline-none focus:border-mustard text-sm"
              />
              <button
                onClick={() => {
                  if (novoHorario.trim()) {
                    setHorariosRetirada((h) => [...h, novoHorario.trim()]);
                    setNovoHorario("");
                  }
                }}
                className="px-3 py-2 rounded-lg bg-mustard text-ink font-black text-sm"
              >
                +
              </button>
            </div>
            {horariosRetirada.length === 0 ? (
              <p className="text-[11px] text-mut/60">Nenhum horário cadastrado — o cliente não verá seletor de horário.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {horariosRetirada.map((h, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-coal rounded-lg px-3 py-1.5 text-sm font-bold border border-graph">
                    {h}
                    <button onClick={() => setHorariosRetirada((arr) => arr.filter((_, j) => j !== i))}
                      className="text-mut hover:text-burnt ml-1">
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-mut/60">As datas e horários valem para retirada e entrega. Salvam com o botão "Salvar alterações".</p>
        </div>

        <ToggleRow titulo="Retirada no local" sub="Cliente retira no ponto de venda (evento, local fixo)." on={entRetirada} onToggle={() => setEntRetirada((v) => !v)} />
        <ToggleRow titulo="Endereço de entrega" sub="Cliente informa rua, bairro, CEP e complemento." on={entEndereco} onToggle={() => setEntEndereco((v) => !v)} />
        <ToggleRow titulo="Escolher unidade / fábrica" sub="Cliente seleciona de uma lista e informa o setor/sala." on={entUnidade} onToggle={() => setEntUnidade((v) => !v)} />

        {/* Cadastro de unidades — só aparece se o modo unidade estiver ligado */}
        {entUnidade && (
          <div className="border-t border-graph pt-4">
            <p className="text-xs font-bold text-mut mb-2 uppercase tracking-wide">Unidades cadastradas</p>
            <div className="flex gap-2 mb-3">
              <input value={novaUnidade} onChange={(e) => setNovaUnidade(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUnidadeHandler()}
                placeholder="Ex: Fábrica A"
                className="flex-1 bg-ink rounded-xl px-4 py-2.5 border border-graph outline-none focus:border-mustard text-sm" />
              <button onClick={addUnidadeHandler} className="px-4 py-2.5 rounded-xl bg-mustard text-ink font-black text-sm">
                Adicionar
              </button>
            </div>
            {(data.unidades || []).length === 0 ? (
              <p className="text-xs text-mut">Nenhuma unidade cadastrada ainda.</p>
            ) : (
              <div className="space-y-2">
                {data.unidades.map((u) => (
                  <div key={u.id} className="flex items-center justify-between bg-ink rounded-lg px-3 py-2">
                    <span className="font-bold text-sm">{u.nome}</span>
                    <button onClick={() => removerUnidade(u.id)} className="text-mut hover:text-burnt p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-mut/60 mt-2">As unidades são salvas na hora. Os modos de entrega salvam no botão abaixo.</p>
          </div>
        )}
      </div>

      {/* Mensagens ao cliente */}
      <div className="bg-coal rounded-2xl border border-graph p-5 space-y-4">
        <h3 className="font-black text-lg flex items-center gap-2">
          <MessageCircle size={18} className="text-mustard" /> Mensagens ao cliente
        </h3>
        <div className="bg-ink rounded-xl p-3 border border-graph">
          <p className="text-xs text-mut leading-relaxed">
            Use estas etiquetas no texto — elas são trocadas automaticamente:
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {["{cliente}", "{itens}", "{total}", "{pix}", "{entrega}", "{motivo}"].map((v) => (
              <code key={v} className="text-[11px] font-mono px-2 py-1 rounded bg-coal border border-graph text-mustard">{v}</code>
            ))}
          </div>
        </div>

        <MsgField
          label="WhatsApp — Pedido aceito (com PIX)"
          hint="Enviada ao tocar em 'Aceitar e avisar'. Use {pix} para incluir a chave."
          value={msgAceite} onChange={setMsgAceite}
        />
        <MsgField
          label="WhatsApp — Pedido recusado"
          hint="Enviada ao recusar com aviso. Use {motivo} para incluir o motivo escolhido."
          value={msgRecusa} onChange={setMsgRecusa}
        />
        <MsgField
          label="WhatsApp — Pedido pronto"
          hint="Enviada ao tocar em 'Avisar cliente' num pedido concluído."
          value={msgPronto} onChange={setMsgPronto}
        />
        <MsgField
          label="Tela — Aguardando confirmação"
          hint="Este texto NÃO é WhatsApp. Aparece na página de acompanhamento do cliente enquanto o pedido está pendente."
          value={msgAguardando} onChange={setMsgAguardando}
        />

        {/* Motivos de recusa */}
        <div className="bg-ink rounded-xl p-3 border border-graph">
          <p className="text-xs font-bold text-mut mb-2 uppercase tracking-wide">Motivos de recusa prontos</p>
          <div className="flex gap-2 mb-2">
            <input
              value={novoMotivo}
              onChange={(e) => setNovoMotivo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && novoMotivo.trim()) {
                  setMotivosRecusa((m) => [...m, novoMotivo.trim()]); setNovoMotivo("");
                }
              }}
              placeholder="Ex: Produto esgotado"
              className="flex-1 bg-coal rounded-lg px-3 py-2 border border-graph outline-none focus:border-mustard text-sm"
            />
            <button
              onClick={() => { if (novoMotivo.trim()) { setMotivosRecusa((m) => [...m, novoMotivo.trim()]); setNovoMotivo(""); } }}
              className="px-3 py-2 rounded-lg bg-mustard text-ink font-black text-sm"
            >+</button>
          </div>
          {motivosRecusa.length === 0 ? (
            <p className="text-[11px] text-mut/60">Nenhum motivo cadastrado — serão usados os padrões.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {motivosRecusa.map((m, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-coal rounded-lg px-3 py-1.5 text-sm font-bold border border-graph">
                  {m}
                  <button onClick={() => setMotivosRecusa((arr) => arr.filter((_, j) => j !== i))}
                    className="text-mut hover:text-burnt ml-1"><X size={13} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={salvar} disabled={busy}
        className="w-full py-3 rounded-xl bg-mustard text-ink font-black disabled:opacity-50 flex items-center justify-center gap-2">
        {ok ? <><Check size={18} /> Salvo!</> : busy ? "Salvando..." : "Salvar alterações"}
      </button>

      {/* Prévia */}
      <div>
        <p className="text-xs font-bold text-mut mb-2 uppercase tracking-wide">Prévia do banner</p>
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-burnt via-[#C2451A] to-ink border border-mustard/20">
          {bannerUrl && (
            <>
              <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/55" />
            </>
          )}
          <div className="relative">
            {!bannerUrl && <div className="absolute -right-4 -top-6 text-[90px] opacity-20 rotate-12 select-none">🍔</div>}
            {logoUrl && <img src={logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover mb-2" />}
            <p className="text-ink font-black text-[10px] uppercase tracking-[0.2em] bg-mustard inline-block px-2 py-0.5 rounded-full mb-2">
              {selo || "Lote aberto agora"}
            </p>
            <h1 className="text-2xl font-black leading-tight mb-1">{titulo || "Faça seu pedido."}</h1>
            <p className="text-cream/80 text-sm whitespace-pre-line">{sub || "Escolha seus itens e envie."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- HISTÓRICO (lotes arquivados) --------------------------------- */
function Historico({ data }) {
  const lotes = data.lotes || [];
  const [aberto, setAberto] = useState(null);

  if (lotes.length === 0) {
    return (
      <div className="text-center py-12 bg-coal rounded-2xl border border-graph">
        <History size={36} className="text-mut mx-auto mb-3" />
        <p className="font-black text-lg">Nenhum lote arquivado ainda</p>
        <p className="text-mut text-sm mt-1">
          Quando você fechar e arquivar um lote no Dashboard, ele aparece aqui.
        </p>
      </div>
    );
  }

  const fmtData = (s) =>
    new Date(s).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="space-y-3">
      <h3 className="font-black text-xl flex items-center gap-2 mb-2">
        <History size={20} className="text-mustard" /> Lotes arquivados ({lotes.length})
      </h3>

      {lotes.map((lote) => {
        const expand = aberto === lote.id;
        const resumo = lote.resumo || {};
        return (
          <div key={lote.id} className="bg-coal rounded-2xl border border-graph overflow-hidden">
            <button
              onClick={() => setAberto(expand ? null : lote.id)}
              className="w-full p-5 flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-3">
                {expand ? <ChevronDown size={20} className="text-mustard" /> : <ChevronRight size={20} className="text-mut" />}
                <div>
                  <p className="font-black text-lg">Lote #{lote.numero}</p>
                  <p className="text-xs text-mut flex items-center gap-1">
                    <Calendar size={11} /> {fmtData(lote.arquivado_em)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-mustard text-lg">{brl(lote.total)}</p>
                <p className="text-xs text-mut">{lote.qtd_pedidos} pedido(s) · {lote.qtd_lanches} lanche(s)</p>
              </div>
            </button>

            {expand && (
              <div className="px-5 pb-5 space-y-4 border-t border-graph pt-4">
                {/* Contagem por lanche */}
                {(resumo.contagem || []).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-mut uppercase tracking-wide mb-2">Lanches vendidos</p>
                    <div className="flex flex-wrap gap-2">
                      {resumo.contagem.map((c, i) => (
                        <span key={i} className="bg-ink rounded-lg px-3 py-1.5 text-sm font-bold">
                          {c.emoji} {c.nome}: <span className="text-mustard">{c.total}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de compras consolidada */}
                {(resumo.compras || []).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-mut uppercase tracking-wide mb-2">Lista de compras</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {resumo.compras.map((item, i) => (
                        <div key={i} className="bg-ink rounded-lg px-3 py-2 flex justify-between text-sm">
                          <span>{item.nome}</span>
                          <span className="font-bold text-mustard">{item.qtd} {item.unidade}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pedidos detalhados */}
                {(resumo.pedidos || []).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-mut uppercase tracking-wide mb-2">Pedidos ({resumo.pedidos.length})</p>
                    <div className="space-y-2">
                      {resumo.pedidos.map((p, i) => (
                        <div key={i} className="bg-ink rounded-xl p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold">{p.cliente}</p>
                              <p className="text-xs text-mut flex items-center gap-1"><Phone size={10} /> {p.telefone}</p>
                            </div>
                            <span className="font-black text-mustard text-sm">{brl(p.total)}</span>
                          </div>
                          <ul className="mt-2 space-y-0.5">
                            {(p.itens || []).map((it, j) => (
                              <li key={j} className="text-sm">
                                <span className="text-mustard font-bold">{it.qtd}x</span> {it.nome}
                                {(it.removidos || []).length > 0 && (
                                  <span className="text-xs text-burnt font-bold"> · sem: {it.removidos.join(", ")}</span>
                                )}
                                {it.observacao && <span className="text-xs text-mut italic"> · {it.observacao}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- APROVAÇÃO (fila de aceite de pedidos) ------------------------ */
function Aprovacao({ data, reload }) {
  const settings = data.settings || {};
  const pendentes = data.orders
    .filter((o) => o.status === "pendente")
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const [processando, setProcessando] = useState(null);
  const [recusandoId, setRecusandoId] = useState(null); // qual pedido está com o menu de motivo aberto
  const motivos = settings.motivos_recusa || [
    "Produto esgotado", "Fora da área de entrega", "Fora do horário de atendimento", "Não foi possível confirmar o pagamento",
  ];

  const aceitar = async (id) => {
    setProcessando(id);
    try { await aceitarPedido(id); reload(); } finally { setProcessando(null); }
  };
  const aceitarEAvisar = async (order) => {
    setProcessando(order.id);
    try {
      await aceitarPedido(order.id);
      avisarAceiteWhatsApp(order, settings); // abre WhatsApp com PIX
      reload();
    } finally { setProcessando(null); }
  };
  const recusar = async (id) => {
    setProcessando(id);
    try { await recusarPedido(id); reload(); } finally { setProcessando(null); setRecusandoId(null); }
  };
  const recusarEAvisar = async (order, motivo) => {
    setProcessando(order.id);
    try {
      await recusarPedido(order.id);
      avisarRecusaWhatsApp(order, settings, motivo); // abre WhatsApp com o motivo
      reload();
    } finally { setProcessando(null); setRecusandoId(null); }
  };

  const fmtHora = (s) =>
    new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (pendentes.length === 0) {
    return (
      <div className="text-center py-12 bg-coal rounded-2xl border border-graph">
        <Bell size={36} className="text-mut mx-auto mb-3" />
        <p className="font-black text-lg">Nenhum pedido aguardando</p>
        <p className="text-mut text-sm mt-1">
          Pedidos novos aparecem aqui para você aceitar antes de irem à cozinha.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-mustard/10 border border-mustard/30 rounded-xl p-3">
        <p className="text-sm font-bold text-mustard">
          {pendentes.length} {pendentes.length === 1 ? "pedido aguardando" : "pedidos aguardando"} sua confirmação.
          Aceite para enviar à cozinha, ou recuse se for duplicado.
        </p>
      </div>

      {pendentes.map((o) => {
        const busy = processando === o.id;
        return (
          <div key={o.id} className="bg-coal rounded-2xl border border-mustard/30 p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-black text-lg leading-tight">{o.cliente}</p>
                <p className="text-xs text-mut flex items-center gap-1 mt-0.5">
                  <Phone size={11} /> {o.telefone} · {fmtHora(o.created_at)}
                </p>
                {o.entrega_texto && (
                  <p className="text-xs text-cream flex items-start gap-1 mt-1">
                    <MapPin size={11} className="text-mustard shrink-0 mt-0.5" /> {o.entrega_texto}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="font-black text-mustard text-lg block">{brl(o.total)}</span>
                <span className="text-xs text-mut">{PAGAMENTO_LABEL[o.pagamento_forma] || o.pagamento_forma}</span>
              </div>
            </div>

            <ul className="space-y-1.5 mb-4 bg-ink rounded-xl p-3">
              {(o.order_items || []).map((it) => (
                <li key={it.id} className="text-sm">
                  <span className="font-black text-mustard">{it.qtd}x</span> {it.nome_lanche}
                  {(it.removidos || []).length > 0 && (
                    <span className="block text-xs text-burnt font-bold ml-5">sem: {(it.removidos || []).join(", ")}</span>
                  )}
                  {it.observacao && <span className="block text-xs text-mut italic ml-5">↳ {it.observacao}</span>}
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              {recusandoId === o.id ? (
                <div className="bg-ink rounded-xl p-3 border border-burnt/40 space-y-2">
                  <p className="text-xs font-bold text-mut uppercase tracking-wide">Motivo da recusa</p>
                  {motivos.map((m, i) => (
                    <button key={i} onClick={() => recusarEAvisar(o, m)} disabled={busy}
                      className="w-full py-2.5 rounded-lg bg-coal hover:bg-graph text-left px-3 text-sm font-bold flex items-center justify-between gap-2 disabled:opacity-50 transition">
                      {m}
                      <MessageCircle size={15} className="text-[#25D366] shrink-0" />
                    </button>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setRecusandoId(null)} disabled={busy}
                      className="flex-1 py-2 rounded-lg bg-graph text-mut font-bold text-sm disabled:opacity-50">
                      Voltar
                    </button>
                    <button onClick={() => recusar(o.id)} disabled={busy}
                      className="flex-1 py-2 rounded-lg bg-graph text-mut hover:text-burnt font-bold text-sm disabled:opacity-50">
                      Recusar sem avisar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <button onClick={() => setRecusandoId(o.id)} disabled={busy}
                      className="flex-1 py-3 rounded-xl bg-graph text-mut hover:text-burnt font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition">
                      <X size={18} /> Recusar
                    </button>
                    <button onClick={() => aceitar(o.id)} disabled={busy}
                      className="flex-1 py-3 rounded-xl bg-[#7BC96F] text-[#11200d] font-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition">
                      <Check size={18} /> {busy ? "..." : "Aceitar"}
                    </button>
                  </div>
                  <button onClick={() => aceitarEAvisar(o)} disabled={busy}
                    className="w-full py-3 rounded-xl bg-[#25D366] text-[#0a3d1c] font-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition">
                    <MessageCircle size={18} /> Aceitar e avisar cliente (WhatsApp + PIX)
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
