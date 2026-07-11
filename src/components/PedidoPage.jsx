import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, Clock, Flame, Package, ArrowLeft, Wallet, Copy, MapPin } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getOrder, brl, informarPagamento, getSettings } from "../lib/api";
import { Brand, Spinner, CenterMessage } from "./ui";

const PAGAMENTO_LABEL = {
  pix: "PIX", dinheiro: "Dinheiro", credito: "Cartão de Crédito", debito: "Cartão de Débito",
};

const STEPS = [
  { key: "recebido",  label: "Pedido recebido",  icon: Check,   desc: "Já está na nossa fila." },
  { key: "producao",  label: "Em produção",      icon: Flame,   desc: "Na chapa agora." },
  { key: "pronto",    label: "Pronto",           icon: Package, desc: "Saindo para você." },
  { key: "concluido", label: "Entregue",         icon: Check,   desc: "Bom apetite!" },
];
const order_of = (s) => STEPS.findIndex((x) => x.key === s);

export default function PedidoPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    getOrder(id)
      .then((o) => mounted && setOrder(o))
      .catch(() => mounted && setNotFound(true))
      .finally(() => mounted && setLoading(false));
    getSettings().then((s) => mounted && setSettings(s)).catch(() => {});

    // Realtime: escuta mudanças de status deste pedido
    const channel = supabase
      .channel(`pedido-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        (payload) => mounted && setOrder((o) => ({ ...o, ...payload.new }))
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) return <Shell marca={settings?.marca} logo={settings?.logo_url}><Spinner label="Buscando seu pedido..." /></Shell>;
  if (notFound || !order)
    return (
      <Shell marca={settings?.marca} logo={settings?.logo_url}>
        <CenterMessage
          icon={<Package size={40} className="text-burnt" />}
          titulo="Pedido não encontrado"
          texto="Esse link de pedido não existe ou expirou."
          acao={{ label: "Voltar ao cardápio", onClick: () => (window.location.href = "/") }}
        />
      </Shell>
    );

  const cur = order_of(order.status);

  return (
    <Shell marca={settings?.marca} logo={settings?.logo_url}>
      <main className="max-w-lg mx-auto px-4 pt-6 pb-12">
        <Link to="/" className="text-mut hover:text-cream text-sm font-bold flex items-center gap-1.5 mb-5">
          <ArrowLeft size={16} /> Voltar ao cardápio
        </Link>

        <div className="bg-coal rounded-2xl border border-graph p-5 mb-5">
          <p className="text-mut text-sm font-bold">Olá, {order.cliente}!</p>
          <h1 className="font-black text-2xl mt-0.5">Acompanhe seu pedido</h1>
          <p className="text-xs text-mut mt-1">
            Esta página atualiza sozinha. Pode deixar aberta. 📡
          </p>
        </div>

        {order.status === "pendente" && (
          <div className="bg-[#2a2418] border border-[#5c4f2f] rounded-2xl p-5 mb-5 text-center">
            <Clock size={36} className="text-[#E8C977] mx-auto mb-2 animate-pulse" />
            <p className="font-black text-lg text-[#E8C977]">Aguardando confirmação</p>
            <p className="text-sm text-mut mt-1 whitespace-pre-line">
              {settings?.msg_aguardando ||
                "Seu pedido foi enviado e está aguardando a equipe confirmar. Assim que for aceito, as informações de pagamento (PIX) vão aparecer aqui para você pagar."}
            </p>
          </div>
        )}

        {order.status === "recusado" && (
          <div className="bg-[#2a1a18] border border-[#5c342f] rounded-2xl p-5 mb-5 text-center">
            <p className="font-black text-lg text-burnt">Pedido não confirmado</p>
            <p className="text-sm text-mut mt-1">
              Este pedido não foi confirmado pela equipe. Se foi engano ou duplicidade, faça um novo pedido.
              Em caso de dúvida, fale com a equipe.
            </p>
          </div>
        )}

        {/* Timeline de status (só após aceito) */}
        {order.status !== "pendente" && order.status !== "recusado" && (
        <div className="bg-coal rounded-2xl border border-graph p-5 mb-5">
          <div className="space-y-1">
            {STEPS.map((step, i) => {
              const done = i < cur;
              const active = i === cur;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full grid place-items-center transition ${
                      done ? "bg-[#7BC96F] text-[#11200d]"
                        : active ? "bg-mustard text-ink animate-pulse"
                        : "bg-graph text-mut"
                    }`}>
                      <Icon size={18} />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 ${i < cur ? "bg-[#7BC96F]" : "bg-graph"}`} />
                    )}
                  </div>
                  <div className={`pt-1.5 ${active ? "" : done ? "opacity-90" : "opacity-40"}`}>
                    <p className="font-black">{step.label}</p>
                    <p className="text-xs text-mut">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Itens */}
        <div className="bg-coal rounded-2xl border border-graph p-5">
          <h2 className="font-black mb-3">Seu pedido</h2>
          <ul className="space-y-2">
            {(order.order_items || []).map((it) => (
              <li key={it.id} className="flex items-start gap-2 text-sm">
                <span className="font-black text-mustard w-7 h-6 grid place-items-center bg-ink rounded shrink-0">
                  {it.qtd}x
                </span>
                <div className="flex-1">
                  <span className="font-bold">{it.nome_lanche}</span>
                  {(it.removidos || []).length > 0 && (
                    <span className="block text-xs text-burnt font-bold">sem: {(it.removidos || []).join(", ")}</span>
                  )}
                  {it.observacao && (
                    <span className="block text-xs text-mut italic">↳ {it.observacao}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-graph mt-3 pt-3 flex justify-between font-black">
            <span>Total</span>
            <span className="text-mustard">{brl(order.total)}</span>
          </div>
        </div>

        {/* Entrega */}
        {order.entrega_texto && (
          <div className="bg-coal rounded-2xl border border-graph p-5 mt-5">
            <h2 className="font-black mb-2 flex items-center gap-2"><MapPin size={18} className="text-mustard" /> Entrega</h2>
            <p className="text-sm text-cream">{order.entrega_texto}</p>
          </div>
        )}

        {/* Pagamento — só aparece depois que o pedido é aceito (não pendente/recusado) */}
        {order.status !== "pendente" && order.status !== "recusado" && (
          <PagamentoBox order={order} settings={settings} onInformar={() => setOrder((o) => ({ ...o, pagamento_status: "informado" }))} />
        )}
      </main>
    </Shell>
  );
}

function PagamentoBox({ order, settings, onInformar }) {
  const [enviando, setEnviando] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const forma = PAGAMENTO_LABEL[order.pagamento_forma] || order.pagamento_forma || "—";
  const status = order.pagamento_status || "nao_pago";
  const ehPix = order.pagamento_forma === "pix";
  const pixChave = settings?.pix_chave;

  const avisar = async () => {
    setEnviando(true);
    try {
      await informarPagamento(order.id);
      onInformar();
    } catch (e) {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-coal rounded-2xl border border-graph p-5 mt-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-black flex items-center gap-2"><Wallet size={18} className="text-mustard" /> Pagamento</h2>
        <span className="text-sm font-bold text-cream">{forma}</span>
      </div>

      {status === "pago" ? (
        <div className="bg-[#1c2a1a] border border-[#3d5c34] rounded-xl p-3 text-center">
          <p className="font-black text-[#7BC96F] flex items-center justify-center gap-2">
            <Check size={18} /> Pagamento confirmado
          </p>
        </div>
      ) : status === "informado" ? (
        <div className="bg-[#2a2418] border border-[#5c4f2f] rounded-xl p-3 text-center">
          <p className="font-bold text-[#E8C977] text-sm">
            Você avisou que pagou. Aguardando a confirmação da equipe. ✅
          </p>
        </div>
      ) : (
        <>
          {ehPix && pixChave && (
            <div className="bg-ink rounded-xl p-3 mb-3">
              <p className="text-xs text-mut mb-1">Pague via PIX para a chave{settings?.pix_nome ? ` (${settings.pix_nome})` : ""}:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono break-all">{pixChave}</code>
                <button
                  onClick={() => { navigator.clipboard?.writeText(pixChave); setPixCopiado(true); setTimeout(() => setPixCopiado(false), 2000); }}
                  className="px-3 py-1.5 rounded-lg bg-mustard text-ink font-black text-xs flex items-center gap-1 whitespace-nowrap"
                >
                  {pixCopiado ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                </button>
              </div>
            </div>
          )}
          <p className="text-sm text-mut mb-3">
            Após realizar o pagamento ({forma}), toque no botão abaixo para avisar a equipe.
          </p>
          <button
            onClick={avisar}
            disabled={enviando}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-mustard to-burnt text-ink font-black disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={18} /> {enviando ? "Enviando..." : "Já fiz o pagamento"}
          </button>
        </>
      )}
    </div>
  );
}

function Shell({ children, marca, logo }) {
  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="sticky top-0 z-30 bg-ink/95 backdrop-blur border-b border-graph">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-3">
          {logo ? (
            <div className="flex items-center gap-2.5">
              <img src={logo} alt={marca || "Logo"} className="w-10 h-10 rounded-lg object-cover" />
              <span className="font-black tracking-tight text-lg truncate">{marca || "BurgerFlow OS"}</span>
            </div>
          ) : (
            <>
              <Brand />
              {marca && marca !== "BurgerFlow OS" && (
                <>
                  <span className="text-graph">|</span>
                  <span className="font-black text-mustard truncate">{marca}</span>
                </>
              )}
            </>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
