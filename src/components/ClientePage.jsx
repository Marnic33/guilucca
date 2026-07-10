import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag, Plus, Minus, User, Phone, Check, Lock, Flame,
  Utensils, MessageSquarePlus, Sliders, Trash2, X, CreditCard,
  Banknote, Smartphone, ShoppingCart, Copy, MapPin, Store, Home,
} from "lucide-react";
import {
  listBurgers, getBatchConfig, listOrders, createOrder,
  totalLanchesPedidos, brl, getSettings, listIngredients, listUnidades,
  quantidadePedidaPorLanche, estoqueRestante, listCategorias,
} from "../lib/api";
import { Brand, Spinner, CenterMessage } from "./ui";

const PAGAMENTOS = [
  { id: "pix",      label: "PIX",      icon: Smartphone },
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "credito",  label: "Crédito",  icon: CreditCard },
  { id: "debito",   label: "Débito",   icon: CreditCard },
];

export default function ClientePage() {
  const [burgers, setBurgers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [config, setConfig] = useState(null);
  const [settings, setSettings] = useState(null);
  const [usados, setUsados] = useState(0);
  const [pedidasMap, setPedidasMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState([]); // itens individuais
  const [configurando, setConfigurando] = useState(null);
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pagamento, setPagamento] = useState("pix");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  // entrega
  const [unidades, setUnidades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [entregaModo, setEntregaModo] = useState("retirada");
  const [endRua, setEndRua] = useState("");
  const [endBairro, setEndBairro] = useState("");
  const [endCep, setEndCep] = useState("");
  const [endCompl, setEndCompl] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [unidadeSetor, setUnidadeSetor] = useState("");
  const [horario, setHorario] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const navigate = useNavigate();

  const carregar = useCallback(async () => {
    try {
      const [b, c, orders, s, ings, unids, cats] = await Promise.all([
        listBurgers(),
        getBatchConfig(),
        listOrders(),
        getSettings().catch(() => null),
        listIngredients().catch(() => []),
        listUnidades().catch(() => []),
        listCategorias().catch(() => []),
      ]);
      setBurgers(b);
      setConfig(c);
      setSettings(s);
      setIngredients(ings);
      setUnidades(unids);
      setCategorias(cats);
      // define o modo de entrega inicial conforme o que a loja aceita
      if (s) {
        if (s.entrega_retirada !== false) setEntregaModo("retirada");
        else if (s.entrega_endereco) setEntregaModo("endereco");
        else if (s.entrega_unidade) setEntregaModo("unidade");
      }
      setUsados(totalLanchesPedidos(orders));
      setPedidasMap(quantidadePedidaPorLanche(orders));
    } catch (e) {
      setErro("Não foi possível carregar o cardápio. Tente recarregar a página.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const adicionarAoCarrinho = (item) => {
    // qtd = 1 por padrão; se > 1, o item já traz o campo preenchido
    const qtd = item.qtd || 1;
    setCart((c) => [...c, { ...item, qtd, uid: Math.random().toString(36).slice(2) }]);
    setConfigurando(null);
  };
  const removerDoCarrinho = (uid) => setCart((c) => c.filter((i) => i.uid !== uid));

  const total = cart.reduce((s, it) => s + it.preco * (it.qtd || 1), 0);
  const totalUnidades = cart.length;

  const cap = 0; // capacidade de lote removida — controle agora é por estoque de cada lanche
  const restantes = Infinity;
  const estouraCapacidade = false;

  // formata data ISO para exibição (10/07)
  const fmtData = (iso) => {
    if (!iso) return "";
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };

  // monta o texto de entrega conforme o modo escolhido
  const montarEntrega = () => {
    // sufixo de agendamento (data + horário) comum a todos os modos
    const agenda = [dataEntrega && fmtData(dataEntrega), horario].filter(Boolean).join(" ");
    let base;
    if (entregaModo === "endereco") {
      const partes = [endRua.trim(), endBairro.trim(), endCep.trim() && `CEP ${endCep.trim()}`, endCompl.trim()]
        .filter(Boolean);
      base = "Entrega: " + partes.join(", ");
    } else if (entregaModo === "unidade") {
      const u = unidades.find((x) => x.id === unidadeId);
      const nome = u?.nome || "";
      base = [nome, unidadeSetor.trim() && `Setor: ${unidadeSetor.trim()}`].filter(Boolean).join(" · ");
    } else {
      base = "Retirada no local";
    }
    return agenda ? `${base} · ${agenda}` : base;
  };

  // valida se os campos do modo escolhido estão preenchidos
  const entregaValida = () => {
    const datas = settings?.datas_disponiveis || [];
    const horarios = settings?.horarios_retirada || [];
    // se há datas/horários cadastrados, são obrigatórios em qualquer modo
    if (datas.length > 0 && !dataEntrega) return false;
    if (horarios.length > 0 && !horario) return false;
    if (entregaModo === "endereco") return endRua.trim() && endBairro.trim();
    if (entregaModo === "unidade") return !!unidadeId;
    return true;
  };

  const enviar = async () => {
    if (!cliente.trim() || !telefone.trim() || cart.length === 0) return;
    if (estouraCapacidade || !entregaValida()) return;
    setEnviando(true);
    setErro("");
    try {
      const itens = cart.map((it) => ({
        burgerId: it.burgerId,
        qtd: it.qtd || 1,
        observacao: it.obs || "",
        removidos: it.removidos || [],
      }));
      const order = await createOrder({
        cliente: cliente.trim(),
        telefone: telefone.trim(),
        itens,
        burgers,
        pagamentoForma: settings?.somente_pix ? "pix" : pagamento,
        entregaModo,
        entregaTexto: montarEntrega(),
      });
      navigate(`/pedido/${order.id}`);
    } catch (e) {
      setErro("Erro ao enviar o pedido. Verifique a conexão e tente de novo.");
      setEnviando(false);
    }
  };

  if (loading) return <Spinner label="Montando o cardápio..." />;

  if (!config?.receiving_open) {
    return (
      <Shell marca={settings?.marca} logo={settings?.logo_url}>
        <CenterMessage
          icon={<Lock size={40} className="text-burnt" />}
          titulo="Pedidos encerrados por enquanto"
          texto="O recebimento deste lote está fechado. Volte em breve para o próximo lote de produção. 🔥"
        />
      </Shell>
    );
  }

  if (cap > 0 && restantes === 0) {
    return (
      <Shell marca={settings?.marca} logo={settings?.logo_url}>
        <CenterMessage
          icon={<Flame size={40} className="text-burnt" />}
          titulo="Lote esgotado!"
          texto="Todas as vagas deste lote já foram preenchidas. Aguarde a abertura do próximo."
        />
      </Shell>
    );
  }

  return (
    <Shell marca={settings?.marca} logo={settings?.logo_url}>
      <main className="max-w-3xl mx-auto px-4 pb-44 pt-6">
        <section className="relative overflow-hidden rounded-3xl mb-6 p-7 bg-gradient-to-br from-burnt via-[#C2451A] to-ink border border-mustard/20">
          {settings?.banner_url ? (
            <>
              <img src={settings.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/55" />
            </>
          ) : (
            <div className="absolute -right-6 -top-8 text-[120px] opacity-20 rotate-12 select-none">🍔</div>
          )}
          <div className="relative">
          <p className="text-ink font-black text-xs uppercase tracking-[0.2em] bg-mustard inline-block px-2.5 py-1 rounded-full mb-3">
            {settings?.banner_selo || "Lote aberto agora"}
          </p>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight mb-2">
            {settings?.banner_titulo || "Monte seu pedido. A gente cuida do fogo."}
          </h1>
          <p className="text-cream/80 max-w-md whitespace-pre-line">
            {settings?.banner_sub || "Escolha seus lanches, informe seu contato e envie. Direto pra cozinha."}
          </p>
          {cap > 0 && (
            <p className="mt-3 text-sm font-bold text-mustard">
              Restam {restantes} {restantes === 1 ? "vaga" : "vagas"} neste lote.
            </p>
          )}
          </div>
        </section>

        <h2 className="font-black text-xl mb-4 flex items-center gap-2">
          <Utensils size={20} className="text-mustard" /> Cardápio
        </h2>

        {(() => {
          // helper: renderiza um card com o estoque calculado
          const renderCard = (b) => {
            const noCarrinho = cart.filter((it) => it.burgerId === b.id)
              .reduce((s, it) => s + (it.qtd || 1), 0);
            const baseRestante = estoqueRestante(b, pedidasMap);
            const restante = baseRestante === null ? null : Math.max(0, baseRestante - noCarrinho);
            return (
              <CardapioCard
                key={b.id}
                burger={b}
                restante={restante}
                onEscolher={() => setConfigurando(b)}
              />
            );
          };

          if (burgers.length === 0) {
            return (
              <p className="text-mut py-8 text-center">Nenhum lanche cadastrado ainda.</p>
            );
          }

          // agrupa por categoria (na ordem cadastrada); sem categoria vai por último
          const secoes = [];
          for (const c of categorias) {
            const doGrupo = burgers.filter((b) => b.categoria_id === c.id);
            if (doGrupo.length > 0) secoes.push({ nome: c.nome, itens: doGrupo });
          }
          const semCategoria = burgers.filter(
            (b) => !b.categoria_id || !categorias.some((c) => c.id === b.categoria_id)
          );
          if (semCategoria.length > 0) {
            secoes.push({ nome: secoes.length > 0 ? "Outros" : null, itens: semCategoria });
          }

          return secoes.map((sec, i) => (
            <div key={i} className={i > 0 ? "mt-8" : ""}>
              {sec.nome && (
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-black text-lg whitespace-nowrap">{sec.nome}</h3>
                  <div className="h-px flex-1 bg-graph" />
                  <span className="text-xs text-mut font-bold">{sec.itens.length}</span>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {sec.itens.map(renderCard)}
              </div>
            </div>
          ));
        })()}

        {cart.length > 0 && (
          <div className="mt-8">
            <h2 className="font-black text-xl mb-1 flex items-center gap-2">
              <ShoppingCart size={20} className="text-mustard" /> Seu carrinho ({cart.length})
            </h2>
            <p className="text-sm text-mut mb-3">
              💡 Você pode pedir vários sabores no <strong className="text-cream">mesmo pedido</strong>.
            </p>
            <div className="space-y-2">
              {cart.map((it) => (
                <div key={it.uid} className="bg-coal rounded-xl border border-graph p-3 flex items-start gap-3">
                  {it.foto_url
                    ? <img src={it.foto_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    : <span className="text-2xl">{it.emoji}</span>}
                  <div className="flex-1">
                    <p className="font-bold">
                      {it.qtd > 1 && <span className="text-mustard font-black">{it.qtd}x </span>}
                      {it.nome}
                    </p>
                    {(it.removidos || []).length > 0 && (
                      <p className="text-xs text-burnt font-bold">sem: {it.removidos.join(", ")}</p>
                    )}
                    {it.obs && <p className="text-xs text-mut italic">↳ {it.obs}</p>}
                  </div>
                  <span className="font-black text-mustard whitespace-nowrap">{brl(it.preco * (it.qtd || 1))}</span>
                  <button onClick={() => removerDoCarrinho(it.uid)} className="text-mut hover:text-burnt p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Convite para adicionar mais um sabor */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-mustard/40 text-mustard font-bold flex items-center justify-center gap-2 hover:bg-mustard/10 transition"
            >
              <Plus size={18} /> Adicionar outro sabor
            </button>
          </div>
        )}

        {erro && (
          <p className="mt-4 text-sm text-burnt bg-burnt/10 border border-burnt/30 rounded-xl p-3">
            {erro}
          </p>
        )}
      </main>

      {configurando && (
        <Configurador
          burger={configurando}
          ingredients={ingredients}
          restante={(() => {
            const noCarrinho = cart.filter((it) => it.burgerId === configurando.id)
              .reduce((s, it) => s + (it.qtd || 1), 0);
            const base = estoqueRestante(configurando, pedidasMap);
            return base === null ? null : Math.max(0, base - noCarrinho);
          })()}
          onCancel={() => setConfigurando(null)}
          onAdd={adicionarAoCarrinho}
        />
      )}

      {cart.length > 0 && !configurando && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-coal border-t border-graph shadow-2xl">
          <div className="max-w-3xl mx-auto p-4">
            {!mostrarCheckout ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-mut text-sm font-bold block">
                    {totalUnidades} {totalUnidades === 1 ? "lanche" : "lanches"}
                  </span>
                  <span className="font-black text-2xl text-mustard">{brl(total)}</span>
                </div>
                <button
                  onClick={() => setMostrarCheckout(true)}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-mustard to-burnt text-ink font-black active:scale-[0.99] transition"
                >
                  Finalizar pedido
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black">Finalizar — {brl(total)}</span>
                  <button onClick={() => setMostrarCheckout(false)} className="text-mut hover:text-cream">
                    <X size={20} />
                  </button>
                </div>

                {estouraCapacidade && (
                  <p className="text-xs text-burnt font-bold">
                    Só restam {restantes} vagas no lote. Remova alguns itens.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Field icon={<User size={16} />} placeholder="Seu nome" value={cliente} onChange={setCliente} />
                  <Field icon={<Phone size={16} />} placeholder="Telefone" value={telefone} onChange={setTelefone} />
                </div>

                {/* Entrega — só aparece se a loja habilitou algo além de retirada simples */}
                <EntregaSelector
                  settings={settings}
                  unidades={unidades}
                  modo={entregaModo} setModo={setEntregaModo}
                  endRua={endRua} setEndRua={setEndRua}
                  endBairro={endBairro} setEndBairro={setEndBairro}
                  endCep={endCep} setEndCep={setEndCep}
                  endCompl={endCompl} setEndCompl={setEndCompl}
                  unidadeId={unidadeId} setUnidadeId={setUnidadeId}
                  unidadeSetor={unidadeSetor} setUnidadeSetor={setUnidadeSetor}
                  horario={horario} setHorario={setHorario}
                  data={dataEntrega} setData={setDataEntrega}
                />

                <div>
                  <p className="text-xs font-bold text-mut mb-1.5 uppercase tracking-wide">Forma de pagamento</p>
                  {settings?.somente_pix ? (
                    <div className="bg-ink border border-mustard/30 rounded-xl p-3">
                      <p className="font-bold text-mustard flex items-center gap-2">
                        <Smartphone size={18} /> Aceitamos somente PIX
                      </p>
                      <p className="text-xs text-mut mt-2">
                        A chave PIX para pagamento aparece assim que a equipe confirmar seu pedido. 🙏
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {PAGAMENTOS.map((p) => {
                        const Icon = p.icon;
                        const ativo = pagamento === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setPagamento(p.id)}
                            className={`py-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                              ativo ? "bg-mustard text-ink border-transparent" : "bg-ink border-graph text-mut"
                            }`}
                          >
                            <Icon size={18} />
                            <span className="text-xs font-bold">{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setRevisando(true)}
                  disabled={!cliente.trim() || !telefone.trim() || enviando || estouraCapacidade || !entregaValida()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-mustard to-burnt text-ink font-black text-base disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-[0.99]"
                >
                  Revisar e enviar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal de revisão antes de enviar */}
      {revisando && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
          <div className="bg-coal w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-graph max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-coal border-b border-graph p-4 flex items-center justify-between">
              <h3 className="font-black text-lg">Confira seu pedido</h3>
              <button onClick={() => setRevisando(false)} className="text-mut hover:text-cream p-1"><X size={22} /></button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-mustard/10 border border-mustard/30 rounded-xl p-3">
                <p className="text-sm font-bold text-mustard">
                  Tudo certo? Se quiser outro sabor, é só adicionar — vai tudo junto neste pedido. 🍔
                </p>
              </div>

              {/* Lanches */}
              <div>
                <p className="text-xs font-bold text-mut uppercase tracking-wide mb-2">
                  {cart.reduce((s, it) => s + (it.qtd || 1), 0)} {cart.reduce((s, it) => s + (it.qtd || 1), 0) === 1 ? "item" : "itens"}
                </p>
                <div className="space-y-2">
                  {cart.map((it) => (
                    <div key={it.uid} className="flex items-start gap-2 bg-ink rounded-xl p-2.5">
                      {it.foto_url
                        ? <img src={it.foto_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        : <span className="text-xl">{it.emoji}</span>}
                      <div className="flex-1">
                        <p className="font-bold text-sm">
                          {it.qtd > 1 && <span className="text-mustard">{it.qtd}x </span>}
                          {it.nome}
                        </p>
                        {(it.removidos || []).length > 0 && (
                          <p className="text-xs text-burnt font-bold">sem: {it.removidos.join(", ")}</p>
                        )}
                        {it.obs && <p className="text-xs text-mut italic">↳ {it.obs}</p>}
                      </div>
                      <span className="font-black text-mustard text-sm">{brl(it.preco * (it.qtd || 1))}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dados */}
              <div className="bg-ink rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-mut">Nome</span><span className="font-bold">{cliente}</span></div>
                <div className="flex justify-between"><span className="text-mut">Telefone</span><span className="font-bold">{telefone}</span></div>
                <div className="flex justify-between gap-3"><span className="text-mut shrink-0">Entrega</span><span className="font-bold text-right">{montarEntrega()}</span></div>
                <div className="flex justify-between"><span className="text-mut">Pagamento</span><span className="font-bold">{settings?.somente_pix ? "PIX" : PAGAMENTOS.find((p) => p.id === pagamento)?.label}</span></div>
                <div className="flex justify-between border-t border-graph pt-1 mt-1">
                  <span className="font-black">Total</span><span className="font-black text-mustard text-lg">{brl(total)}</span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-coal border-t border-graph p-4 space-y-2">
              <button
                onClick={() => { setRevisando(false); setMostrarCheckout(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full py-3 rounded-xl bg-graph hover:bg-mustard hover:text-ink font-bold flex items-center justify-center gap-2 transition"
              >
                <Plus size={18} /> Adicionar mais um lanche
              </button>
              <button
                onClick={enviar}
                disabled={enviando}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-mustard to-burnt text-ink font-black disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99] transition"
              >
                <Check size={18} /> {enviando ? "Enviando..." : "Confirmar e enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, marca, logo }) {
  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="sticky top-0 z-30 bg-ink/95 backdrop-blur border-b border-graph">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
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

function CardapioCard({ burger, restante, onEscolher }) {
  const esgotado = restante !== null && restante <= 0;
  const poucos = restante !== null && restante > 0 && restante <= 5;
  return (
    <div className={`bg-coal rounded-2xl border overflow-hidden flex flex-col transition ${
      esgotado ? "border-graph opacity-60" : "border-graph hover:border-mustard/40"
    }`}>
      {burger.foto_url ? (
        <div className="aspect-square bg-ink overflow-hidden relative">
          <img src={burger.foto_url} alt={burger.nome}
            className={`w-full h-full object-cover ${esgotado ? "grayscale" : ""}`} />
          {esgotado && (
            <div className="absolute inset-0 bg-black/60 grid place-items-center">
              <span className="bg-burnt text-white font-black px-3 py-1 rounded-lg text-sm uppercase tracking-wide">Esgotado</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-graph to-ink grid place-items-center text-6xl select-none relative">
          {burger.emoji || "🍔"}
          {esgotado && (
            <div className="absolute inset-0 bg-black/60 grid place-items-center">
              <span className="bg-burnt text-white font-black px-3 py-1 rounded-lg text-sm uppercase tracking-wide">Esgotado</span>
            </div>
          )}
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-lg leading-tight">{burger.nome}</h3>
          <span className="font-black text-mustard whitespace-nowrap">{brl(burger.preco)}</span>
        </div>
        <p className="text-sm text-mut mt-1.5 flex-1">{burger.descricao}</p>

        {/* Selo de estoque */}
        {restante !== null && !esgotado && (
          <p className={`text-xs font-bold mt-2 ${poucos ? "text-burnt" : "text-mut"}`}>
            {poucos ? `⚡ Últimas ${restante} unidades!` : `Restam ${restante} unidades`}
          </p>
        )}

        <button
          onClick={onEscolher}
          disabled={esgotado}
          className={`mt-4 w-full py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
            esgotado
              ? "bg-ink text-mut cursor-not-allowed"
              : "bg-graph hover:bg-mustard hover:text-ink"
          }`}
        >
          {esgotado ? "Esgotado" : <><Plus size={16} /> Escolher</>}
        </button>
      </div>
    </div>
  );
}

function Configurador({ burger, ingredients, restante, onCancel, onAdd }) {
  const [removidos, setRemovidos] = useState([]);
  const [obs, setObs] = useState("");
  const [qtd, setQtd] = useState(1);

  // limite = menor entre qtd_maxima do produto e estoque restante
  const limiteProduto = burger.qtd_maxima || 99;
  const limiteEstoque = restante === null ? 99 : restante;
  const maxQtd = Math.max(1, Math.min(limiteProduto, limiteEstoque));

  const ingMap = Object.fromEntries(ingredients.map((i) => [i.id, i]));
  const ingredientesDoLanche = (burger.ficha || [])
    .map((f) => ingMap[f.ingredienteId]?.nome)
    .filter(Boolean);

  const toggle = (nome) =>
    setRemovidos((r) => (r.includes(nome) ? r.filter((n) => n !== nome) : [...r, nome]));

  const adicionar = () =>
    onAdd({
      burgerId: burger.id,
      nome: burger.nome,
      preco: Number(burger.preco),
      emoji: burger.emoji,
      foto_url: burger.foto_url || null,
      removidos,
      obs: obs.trim(),
      qtd,
    });

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-coal w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-graph max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-coal border-b border-graph p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {burger.foto_url
              ? <img src={burger.foto_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
              : <span className="text-2xl">{burger.emoji}</span>}
            <div>
              <h3 className="font-black text-lg leading-tight">{burger.nome}</h3>
              <span className="text-mustard font-black text-sm">{brl(burger.preco)}</span>
            </div>
          </div>
          <button onClick={onCancel} className="text-mut hover:text-cream p-1"><X size={22} /></button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-mut">{burger.descricao}</p>

          {ingredientesDoLanche.length > 0 && burger.permite_personalizar !== false && (
            <div>
              <p className="text-xs font-bold text-mut mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Sliders size={14} /> Personalizar ingredientes
              </p>
              <div className="flex flex-wrap gap-2">
                {ingredientesDoLanche.map((nome) => {
                  const fora = removidos.includes(nome);
                  return (
                    <button
                      key={nome}
                      onClick={() => toggle(nome)}
                      className={`text-sm font-bold px-3 py-2 rounded-lg border transition ${
                        fora
                          ? "bg-transparent border-graph text-mut line-through"
                          : "bg-graph border-transparent text-cream"
                      }`}
                    >
                      {fora ? "+ " : "✓ "}{nome}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-mut/60 mt-1.5">
                Toque para remover/adicionar. Riscado = sem o ingrediente.
              </p>
            </div>
          )}

          {/* Quando não permite personalizar: não mostra ingredientes ao cliente */}

          <div>
            <p className="text-xs font-bold text-mut mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquarePlus size={14} /> Observação (opcional)
            </p>
            <input
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ex: alguma observação para o preparo..."
              className="w-full bg-ink rounded-lg px-3 py-2.5 text-sm border border-graph focus:border-mustard outline-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-coal border-t border-graph p-4 space-y-3">
          {/* Seletor de quantidade */}
          <div className="flex items-center justify-between gap-3 bg-ink rounded-xl px-4 py-3 border border-graph">
            <span className="font-bold text-sm">Quantidade</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQtd((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full bg-graph hover:bg-mustard hover:text-ink font-black text-lg flex items-center justify-center transition"
              >
                −
              </button>
              <span className="font-black text-xl w-6 text-center">{qtd}</span>
              <button
                onClick={() => setQtd((q) => Math.min(maxQtd, q + 1))}
                disabled={qtd >= maxQtd}
                className="w-9 h-9 rounded-full bg-graph hover:bg-mustard hover:text-ink font-black text-lg flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <span className="font-black text-mustard text-sm w-20 text-right">
              {brl(Number(burger.preco) * qtd)}
            </span>
          </div>
          {burger.qtd_maxima && qtd >= burger.qtd_maxima && (
            <p className="text-xs text-[#E8C977] text-center font-bold">
              Máximo de {burger.qtd_maxima} unidades por pedido para este produto.
            </p>
          )}
          <button
            onClick={adicionar}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-mustard to-burnt text-ink font-black active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Adicionar {qtd > 1 ? `${qtd}x ` : ""}ao carrinho
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, placeholder, value, onChange }) {
  return (
    <div className="flex items-center gap-2 bg-ink rounded-xl px-3 border border-graph focus-within:border-mustard transition">
      <span className="text-mut">{icon}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent py-3 w-full placeholder-mut/60 outline-none text-sm"
      />
    </div>
  );
}

function EntregaSelector(props) {
  const { settings, unidades, modo, setModo } = props;
  // quais modos a loja aceita
  const modos = [];
  if (settings?.entrega_retirada !== false) modos.push({ id: "retirada", label: "Retirar no local", icon: Store });
  if (settings?.entrega_endereco) modos.push({ id: "endereco", label: "Entrega", icon: Home });
  if (settings?.entrega_unidade) modos.push({ id: "unidade", label: "Unidade", icon: MapPin });

  const horarios = settings?.horarios_retirada || [];
  const datas = settings?.datas_disponiveis || [];

  // se só tem retirada, sem datas e sem horários, não mostra nada extra
  if (modos.length <= 1 && modo === "retirada" && horarios.length === 0 && datas.length === 0) return null;

  const inputCls = "w-full bg-ink rounded-lg px-3 py-2.5 text-sm border border-graph focus:border-mustard outline-none";

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-mut uppercase tracking-wide flex items-center gap-1.5">
        <MapPin size={14} /> Onde entregar
      </p>

      {modos.length > 1 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${modos.length}, 1fr)` }}>
          {modos.map((m) => {
            const Icon = m.icon;
            const ativo = modo === m.id;
            return (
              <button key={m.id} onClick={() => setModo(m.id)}
                className={`py-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  ativo ? "bg-mustard text-ink border-transparent" : "bg-ink border-graph text-mut"
                }`}>
                <Icon size={16} />
                <span className="text-xs font-bold">{m.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Campos específicos de endereço/unidade */}
      {modo === "endereco" && (
        <div className="space-y-2">
          <input className={inputCls} placeholder="Rua e número" value={props.endRua} onChange={(e) => props.setEndRua(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} placeholder="Bairro" value={props.endBairro} onChange={(e) => props.setEndBairro(e.target.value)} />
            <input className={inputCls} placeholder="CEP" value={props.endCep} onChange={(e) => props.setEndCep(e.target.value)} />
          </div>
          <input className={inputCls} placeholder="Complemento (opcional)" value={props.endCompl} onChange={(e) => props.setEndCompl(e.target.value)} />
        </div>
      )}

      {modo === "unidade" && (
        <div className="space-y-2">
          <select className={inputCls} value={props.unidadeId} onChange={(e) => props.setUnidadeId(e.target.value)}>
            <option value="">Selecione a unidade...</option>
            {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <input className={inputCls} placeholder="Setor / sala (opcional)" value={props.unidadeSetor} onChange={(e) => props.setUnidadeSetor(e.target.value)} />
        </div>
      )}

      {/* Data e horário — valem para qualquer modo */}
      {datas.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-mut font-bold">Data</p>
          <select className={inputCls} value={props.data || ""} onChange={(e) => props.setData(e.target.value)}>
            <option value="">Selecione uma data...</option>
            {datas.map((d, i) => <option key={i} value={d}>{formatarDataClienteBR(d)}</option>)}
          </select>
        </div>
      )}

      {horarios.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-mut font-bold">Horário</p>
          <select className={inputCls} value={props.horario || ""} onChange={(e) => props.setHorario(e.target.value)}>
            <option value="">Selecione um horário...</option>
            {horarios.map((h, i) => <option key={i} value={h}>{h}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

/* Formata "2026-07-10" como "10/07 (sexta)" para o cliente */
function formatarDataClienteBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")} · ${dias[dt.getDay()]}`;
}
