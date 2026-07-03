import { supabase } from "./supabase";

/* ============================================================================
   api.js — toda comunicação com o banco + motores de cálculo puros
   ========================================================================== */

/* ---------- Helpers de formatação ---------------------------------------- */
export const brl = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ---------- INGREDIENTES -------------------------------------------------- */
export async function listIngredients() {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("nome");
  if (error) throw error;
  return data;
}
export async function addIngredient(nome, unidade) {
  const { data, error } = await supabase
    .from("ingredients")
    .insert({ nome, unidade })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function deleteIngredient(id) {
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- LANCHES (com ficha técnica) ----------------------------------- */
export async function listBurgers() {
  const { data, error } = await supabase
    .from("burgers")
    .select("*, burger_ingredients(*)")
    .order("created_at");
  if (error) throw error;
  return (data || []).map((b) => ({
    ...b,
    ficha: (b.burger_ingredients || []).map((f) => ({
      ingredienteId: f.ingredient_id,
      qtd: Number(f.qtd),
    })),
  }));
}

export async function saveBurger(burger) {
  const payload = {
    nome: burger.nome,
    descricao: burger.descricao,
    preco: Number(burger.preco) || 0,
    emoji: burger.emoji,
    foto_url: burger.foto_url || null,
    permite_personalizar: burger.permite_personalizar !== false,
    qtd_maxima: burger.qtd_maxima ? Number(burger.qtd_maxima) : null,
  };

  let burgerId = burger.id;
  if (burger._isNew) {
    const { data, error } = await supabase
      .from("burgers")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    burgerId = data.id;
  } else {
    const { error } = await supabase
      .from("burgers")
      .update(payload)
      .eq("id", burgerId);
    if (error) throw error;
  }

  // Substitui a ficha técnica (delete + insert)
  await supabase.from("burger_ingredients").delete().eq("burger_id", burgerId);
  const fichaRows = burger.ficha
    .filter((f) => f.ingredienteId && f.qtd > 0)
    .map((f) => ({
      burger_id: burgerId,
      ingredient_id: f.ingredienteId,
      qtd: f.qtd,
    }));
  if (fichaRows.length) {
    const { error } = await supabase.from("burger_ingredients").insert(fichaRows);
    if (error) throw error;
  }
  return burgerId;
}

export async function deleteBurger(id) {
  const { error } = await supabase.from("burgers").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- UPLOAD DE FOTO (com recorte quadrado + compressão) ------------ */
/* Recorta a imagem em quadrado (centralizado), reduz para `size` px e
   comprime em JPEG. Tudo no navegador, antes de enviar ao Storage.        */
function processarImagem(file, size = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      const lado = Math.min(img.width, img.height);
      const sx = (img.width - lado) / 2;
      const sy = (img.height - lado) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, lado, lado, 0, 0, size, size);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao processar imagem"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* Envia a foto ao bucket "lanches" e devolve a URL pública. */
export async function uploadFotoLanche(file) {
  const blob = await processarImagem(file);
  const nome = `lanche-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from("lanches")
    .upload(nome, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("lanches").getPublicUrl(nome);
  return data.publicUrl;
}

/* Envia o logo da loja ao bucket "logos" e devolve a URL pública.
   Logo é comprimido um pouco maior e com mais qualidade que as fotos. */
export async function uploadLogo(file) {
  const blob = await processarImagem(file, 512, 0.9);
  const nome = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from("logos")
    .upload(nome, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("logos").getPublicUrl(nome);
  return data.publicUrl;
}

/* Imagem de fundo do banner: mais larga, sem recorte quadrado forçado. */
export async function uploadBanner(file) {
  const blob = await processarImagemLarga(file, 1200, 0.82);
  const nome = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from("logos")
    .upload(nome, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("logos").getPublicUrl(nome);
  return data.publicUrl;
}

/* Processa mantendo proporção (sem recorte), limitando a largura máxima. */
function processarImagemLarga(file, maxW = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      const escala = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * escala);
      const h = Math.round(img.height * escala);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao processar imagem"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- CONFIGURAÇÃO DO LOTE ------------------------------------------ */
export async function getBatchConfig() {
  const { data, error } = await supabase
    .from("batch_config")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data;
}
export async function setBatchConfig(patch) {
  const { error } = await supabase
    .from("batch_config")
    .update(patch)
    .eq("id", 1);
  if (error) throw error;
}

/* ---------- PEDIDOS -------------------------------------------------------- */
export async function listOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getOrder(id) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createOrder({ cliente, telefone, itens, burgers, pagamentoForma, entregaModo, entregaTexto }) {
  const burgerMap = Object.fromEntries(burgers.map((b) => [b.id, b]));
  const total = itens.reduce(
    (s, it) => s + (burgerMap[it.burgerId]?.preco || 0) * it.qtd,
    0
  );

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      cliente, telefone, total, status: "pendente",
      pagamento_forma: pagamentoForma || "pix",
      pagamento_status: "nao_pago",
      entrega_modo: entregaModo || "retirada",
      entrega_texto: entregaTexto || "",
    })
    .select()
    .single();
  if (error) throw error;

  const rows = itens.map((it) => {
    const b = burgerMap[it.burgerId];
    return {
      order_id: order.id,
      burger_id: it.burgerId,
      nome_lanche: b?.nome || "Lanche",
      preco_unit: b?.preco || 0,
      qtd: it.qtd,
      observacao: it.observacao || "",
      removidos: it.removidos || [],
    };
  });
  const { error: e2 } = await supabase.from("order_items").insert(rows);
  if (e2) throw e2;

  return order;
}

/* ---------- PAGAMENTO ----------------------------------------------------- */
/* Cliente avisa que pagou (na página de acompanhamento) */
export async function informarPagamento(orderId) {
  const { error } = await supabase
    .from("orders")
    .update({ pagamento_status: "informado" })
    .eq("id", orderId);
  if (error) throw error;
}
/* Admin define o status de pagamento (nao_pago | informado | pago) */
export async function setPagamentoStatus(orderId, status) {
  const { error } = await supabase
    .from("orders")
    .update({ pagamento_status: status })
    .eq("id", orderId);
  if (error) throw error;
}

export async function updateOrderStatus(id, status) {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

/* Aceite de pedidos (fila de aprovação) */
export async function aceitarPedido(id) {
  await updateOrderStatus(id, "recebido");
}
export async function recusarPedido(id) {
  await updateOrderStatus(id, "recusado");
}

/* Exclui um pedido de vez (itens somem junto por cascade). Usado para
   remover duplicados que já estavam na cozinha. */
export async function deleteOrder(id) {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}

/* Arquiva um pedido individual: sai da cozinha, mas continua contando
   no faturamento e na lista (status 'arquivado'). */
export async function arquivarPedido(id) {
  await updateOrderStatus(id, "arquivado");
}

/* Baixa por UNIDADE. Define quantas unidades de uma linha de item já saíram
   (0..qtd) e recalcula o status do pedido:
   - nenhuma unidade entregue → recebido
   - algumas entregues        → producao
   - todas entregues          → concluido                                    */
export async function setItemEntregues(orderId, itemId, entregues) {
  const n = Math.max(0, parseInt(entregues) || 0);
  const { error } = await supabase
    .from("order_items")
    .update({ entregues: n, entregue: false }) // `entregue` recalculado abaixo
    .eq("id", itemId);
  if (error) throw error;

  // marca o booleano legado conforme a linha estiver completa
  const { data: item } = await supabase
    .from("order_items")
    .select("qtd")
    .eq("id", itemId)
    .single();
  if (item) {
    await supabase
      .from("order_items")
      .update({ entregue: n >= item.qtd })
      .eq("id", itemId);
  }

  // recalcula o status do pedido com base em todas as linhas
  const { data: items, error: e2 } = await supabase
    .from("order_items")
    .select("qtd, entregues")
    .eq("order_id", orderId);
  if (e2) throw e2;

  const totalUnidades = items.reduce((s, i) => s + i.qtd, 0);
  const entreguesUnidades = items.reduce((s, i) => s + Math.min(i.entregues, i.qtd), 0);
  const novoStatus =
    entreguesUnidades === 0 ? "recebido"
    : entreguesUnidades >= totalUnidades ? "concluido"
    : "producao";

  await updateOrderStatus(orderId, novoStatus);
  return novoStatus;
}

/* ---------- SETTINGS (marca + textos do cardápio) ------------------------- */
export async function getSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data;
}
export async function saveSettings(patch) {
  const { error } = await supabase
    .from("settings")
    .update(patch)
    .eq("id", 1);
  if (error) throw error;
}

/* ---------- UNIDADES / FÁBRICAS ------------------------------------------- */
export async function listUnidades() {
  const { data, error } = await supabase
    .from("unidades")
    .select("*")
    .order("nome");
  if (error) throw error;
  return data;
}
export async function addUnidade(nome) {
  const { data, error } = await supabase
    .from("unidades")
    .insert({ nome })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function deleteUnidade(id) {
  const { error } = await supabase.from("unidades").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- LOTES (histórico arquivado) ----------------------------------- */
export async function listLotes() {
  const { data, error } = await supabase
    .from("lotes")
    .select("*")
    .order("arquivado_em", { ascending: false });
  if (error) throw error;
  return data;
}

/* Arquiva o lote atual: monta um retrato completo, salva em `lotes`,
   e limpa os pedidos ativos para começar o próximo lote do zero.        */
export async function arquivarLote({ orders, burgers, ingredients }) {
  if (!orders.length) throw new Error("Nenhum pedido para arquivar.");

  const total = orders.reduce((s, o) => s + Number(o.total), 0);
  const qtdLanches = totalLanchesPedidos(orders);
  const compras = calcShoppingList(orders, burgers, ingredients);
  const contagem = calcBurgerCounts(orders, burgers).map((c) => ({
    nome: c.nome, emoji: c.emoji, total: c.total,
  }));

  // Retrato fiel dos pedidos (não depende de dados que podem mudar depois)
  const pedidosSnapshot = orders.map((o) => ({
    cliente: o.cliente,
    telefone: o.telefone,
    total: Number(o.total),
    status: o.status,
    pagamento_forma: o.pagamento_forma || "—",
    pagamento_status: o.pagamento_status || "nao_pago",
    criado_em: o.created_at,
    itens: (o.order_items || []).map((it) => ({
      nome: it.nome_lanche,
      qtd: it.qtd,
      preco_unit: Number(it.preco_unit),
      observacao: it.observacao || "",
      removidos: it.removidos || [],
      entregues: it.entregues || 0,
      entregue: !!it.entregue,
    })),
  }));

  const resumo = { pedidos: pedidosSnapshot, contagem, compras };

  // 1) salva o lote no histórico
  const { error: e1 } = await supabase.from("lotes").insert({
    total, qtd_lanches: qtdLanches, qtd_pedidos: orders.length, resumo,
  });
  if (e1) throw e1;

  // 2) limpa os pedidos ativos (order_items some junto por cascade)
  const ids = orders.map((o) => o.id);
  const { error: e2 } = await supabase.from("orders").delete().in("id", ids);
  if (e2) throw e2;

  // 3) fecha o recebimento — o próximo lote é aberto manualmente pelo admin
  await setBatchConfig({ receiving_open: false });
}

/* ============================================================================
   MOTORES DE CÁLCULO (puros, testáveis)
   ========================================================================== */

/* Um pedido só "conta" (faturamento, compras, contagem, capacidade) quando
   já foi aceito. Pendentes e recusados ficam de fora. */
export function pedidoConta(order) {
  return order.status !== "pendente" && order.status !== "recusado";
}

/* Explosão de ingredientes: pedidos × ficha técnica → lista consolidada.
   Desconta ingredientes que o cliente removeu (campo `removidos` por item). */
export function calcShoppingList(orders, burgers, ingredients) {
  const ingMap = Object.fromEntries(ingredients.map((i) => [i.id, i]));
  const burgerMap = Object.fromEntries(burgers.map((b) => [b.id, b]));
  const totals = {};

  for (const order of orders) {
    if (!pedidoConta(order)) continue;
    for (const item of order.order_items || []) {
      const burger = burgerMap[item.burger_id];
      if (!burger) continue;
      // nomes de ingredientes removidos neste item (em minúsculas)
      const removidos = (item.removidos || []).map((r) =>
        String(r).toLowerCase()
      );
      for (const comp of burger.ficha) {
        const ing = ingMap[comp.ingredienteId];
        if (ing && removidos.includes(ing.nome.toLowerCase())) continue; // pulou: foi removido
        totals[comp.ingredienteId] =
          (totals[comp.ingredienteId] || 0) + comp.qtd * item.qtd;
      }
    }
  }

  return Object.entries(totals)
    .filter(([, qtd]) => qtd > 0)
    .map(([ingId, qtd]) => ({
      id: ingId,
      nome: ingMap[ingId]?.nome ?? "Ingrediente removido",
      unidade: ingMap[ingId]?.unidade ?? "",
      qtd,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

/* Contagem por tipo de lanche (só pedidos aceitos) */
export function calcBurgerCounts(orders, burgers) {
  const counts = {};
  for (const order of orders) {
    if (!pedidoConta(order)) continue;
    for (const item of order.order_items || [])
      counts[item.burger_id] = (counts[item.burger_id] || 0) + item.qtd;
  }
  return burgers
    .map((b) => ({ ...b, total: counts[b.id] || 0 }))
    .filter((b) => b.total > 0)
    .sort((a, b) => b.total - a.total);
}

/* Total de lanches já pedidos e aceitos (para checar capacidade do lote) */
export function totalLanchesPedidos(orders) {
  let n = 0;
  for (const o of orders) {
    if (!pedidoConta(o)) continue;
    for (const it of o.order_items || []) n += it.qtd;
  }
  return n;
}
