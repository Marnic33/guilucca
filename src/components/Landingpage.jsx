import { useState, useEffect } from "react";

const VERMELHO = "#E8453C";
const AMARELO = "#F5A623";
const CARVAO = "#1A1A1A";
const CARVAO2 = "#242424";
const BRANCO = "#FFFFFF";

// ── utilitários de estilo inline ──────────────────────────────────────────────
const S = {
  page: {
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    background: CARVAO,
    color: BRANCO,
    minHeight: "100vh",
    overflowX: "hidden",
  },

  // ── HERO ──────────────────────────────────────────────────────────────────
  hero: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  heroBg: {
    position: "absolute", inset: 0,
    background: `linear-gradient(160deg, ${VERMELHO}22 0%, ${CARVAO} 60%)`,
    zIndex: 0,
  },
  heroWordmark: {
    position: "absolute",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "clamp(80px, 20vw, 260px)",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: BRANCO,
    opacity: 0.04,
    whiteSpace: "nowrap",
    userSelect: "none",
    zIndex: 1,
    lineHeight: 1,
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    padding: "0 24px 56px",
    maxWidth: 680,
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: VERMELHO,
    color: BRANCO,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    padding: "6px 14px",
    borderRadius: 4,
    marginBottom: 24,
  },
  heroDot: {
    width: 6, height: 6,
    borderRadius: "50%",
    background: AMARELO,
    animation: "pulse 1.8s ease-in-out infinite",
  },
  heroTitle: {
    fontSize: "clamp(44px, 10vw, 88px)",
    fontWeight: 900,
    lineHeight: 1.0,
    letterSpacing: "-0.03em",
    margin: "0 0 20px",
  },
  heroTitleAccent: {
    color: AMARELO,
    display: "block",
  },
  heroSub: {
    fontSize: "clamp(15px, 2.2vw, 18px)",
    color: "rgba(255,255,255,0.65)",
    lineHeight: 1.6,
    maxWidth: 460,
    margin: "0 0 36px",
  },
  heroBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: AMARELO,
    color: CARVAO,
    fontWeight: 800,
    fontSize: 16,
    padding: "16px 32px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: `0 4px 24px ${AMARELO}44`,
  },
  heroBtnArrow: {
    fontSize: 20,
    transition: "transform 0.2s",
  },
  heroScroll: {
    position: "absolute",
    bottom: 28, right: 28,
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    opacity: 0.4,
  },
  heroScrollLine: {
    width: 1, height: 40,
    background: BRANCO,
    animation: "scrollPulse 2s ease-in-out infinite",
  },
  heroScrollText: {
    fontSize: 9,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    writingMode: "vertical-rl",
    color: BRANCO,
  },

  // ── VISUAIS DE PRODUTO (faixa de fotos) ────────────────────────────────────
  faixa: {
    display: "flex",
    gap: 2,
    height: 180,
    overflow: "hidden",
  },
  faixaItem: {
    flex: 1,
    background: `${CARVAO2}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 48,
    position: "relative",
    overflow: "hidden",
  },
  faixaOverlay: {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(180deg, transparent 40%, ${CARVAO}cc 100%)`,
  },

  // ── SEÇÃO DIFERENCIAIS ─────────────────────────────────────────────────────
  diferenciais: {
    padding: "72px 24px",
    maxWidth: 960,
    margin: "0 auto",
  },
  difLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: VERMELHO,
    marginBottom: 8,
  },
  difTitle: {
    fontSize: "clamp(28px, 5vw, 44px)",
    fontWeight: 900,
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    marginBottom: 52,
  },
  difGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 28,
  },
  difCard: {
    background: CARVAO2,
    border: `1px solid rgba(255,255,255,0.07)`,
    borderRadius: 12,
    padding: "28px 24px",
    position: "relative",
    overflow: "hidden",
    transition: "border-color 0.2s, transform 0.2s",
  },
  difCardHover: {
    borderColor: `${AMARELO}55`,
    transform: "translateY(-2px)",
  },
  difCardAccent: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${VERMELHO}, ${AMARELO})`,
    borderRadius: "12px 12px 0 0",
  },
  difEmoji: {
    fontSize: 32,
    marginBottom: 14,
    display: "block",
  },
  difCardTitle: {
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 8,
    letterSpacing: "-0.01em",
  },
  difCardText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.6,
  },

  // ── CTA FINAL ──────────────────────────────────────────────────────────────
  ctaSection: {
    padding: "0 24px 80px",
    textAlign: "center",
    maxWidth: 640,
    margin: "0 auto",
  },
  ctaStrip: {
    height: 3,
    background: `linear-gradient(90deg, transparent, ${VERMELHO}, ${AMARELO}, transparent)`,
    marginBottom: 64,
    opacity: 0.4,
  },
  ctaTitle: {
    fontSize: "clamp(30px, 6vw, 52px)",
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    marginBottom: 16,
  },
  ctaSub: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 36,
    lineHeight: 1.6,
  },
  ctaBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: VERMELHO,
    color: BRANCO,
    fontWeight: 800,
    fontSize: 16,
    padding: "18px 40px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    boxShadow: `0 4px 32px ${VERMELHO}55`,
    transition: "transform 0.15s, box-shadow 0.15s",
  },

  // ── RODAPÉ ─────────────────────────────────────────────────────────────────
  footer: {
    borderTop: `1px solid rgba(255,255,255,0.07)`,
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    maxWidth: 960,
    margin: "0 auto",
  },
  footerLogo: {
    fontWeight: 900,
    fontSize: 14,
    letterSpacing: "0.05em",
    color: "rgba(255,255,255,0.5)",
  },
  footerLinks: {
    display: "flex",
    gap: 20,
    alignItems: "center",
  },
  footerLink: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    textDecoration: "none",
  },
};

const DIFERENCIAIS = [
  {
    emoji: "🫓",
    title: "Artesanal de verdade",
    text: "Massa semi-folhada feita com ingredientes selecionados. Cada baguete sai do forno com cuidado e capricho.",
  },
  {
    emoji: "🚚",
    title: "Entregamos pra você",
    text: "Envios para todo o Brasil. Frescor e sabor garantidos na sua mesa, no seu escritório, na sua empresa.",
  },
  {
    emoji: "⚡",
    title: "Peça em segundos",
    text: "Cardápio digital, direto no celular. Sem ligação, sem complicação. Escolha, mande e aguarde o sabor.",
  },
];

export default function LandingPage() {
  const [btnHover, setBtnHover] = useState(false);
  const [ctaBtnHover, setCtaBtnHover] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // link do cardápio — quando estiver no repositório, aponta pra /cardapio
  const LINK_CARDAPIO = "/cardapio";

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 1; height: 40px; }
          50% { opacity: 0.3; height: 24px; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-content { animation: fadeUp 0.7s ease both; }
        .dif-card { transition: border-color 0.2s, transform 0.2s; }
        .cta-btn:hover { transform: translateY(-2px) !important; }
        .hero-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 32px ${AMARELO}66 !important; }
        @media (max-width: 600px) {
          .footer-inner { flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={S.hero}>
        <div style={S.heroBg} />

        {/* Wordmark fantasma */}
        <div style={S.heroWordmark} aria-hidden>ARTESANAL</div>

        {/* Conteúdo principal */}
        <div style={S.heroContent} className="hero-content">
          <div style={S.heroBadge}>
            <span style={S.heroDot} />
            Pedidos abertos agora
          </div>

          <h1 style={S.heroTitle}>
            Sabor que
            <span style={S.heroTitleAccent}>você sente</span>
            na primeira mordida.
          </h1>

          <p style={S.heroSub}>
            Baguetes artesanais, salgados e doces feitos com carinho.
            Peça pelo cardápio digital — rápido, fácil e direto pra cozinha.
          </p>

          <a
            href={LINK_CARDAPIO}
            style={{
              ...S.heroBtn,
              ...(btnHover ? { transform: "translateY(-2px)", boxShadow: `0 8px 32px ${AMARELO}66` } : {}),
            }}
            className="hero-btn"
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            Ver cardápio
            <span style={{ ...S.heroBtnArrow, transform: btnHover ? "translateX(4px)" : "none" }}>
              →
            </span>
          </a>
        </div>

        {/* Indicador de scroll */}
        <div style={S.heroScroll} aria-hidden>
          <span style={S.heroScrollText}>role</span>
          <div style={S.heroScrollLine} />
        </div>
      </section>

      {/* ── FAIXA DE PRODUTO (emojis decorativos no protótipo) ── */}
      <div style={S.faixa}>
        {["🫓", "🥐", "🫓", "🧀", "🥩"].map((e, i) => (
          <div
            key={i}
            style={{
              ...S.faixaItem,
              background: i % 2 === 0 ? "#2a1a0a" : "#1a0e08",
            }}
          >
            <span style={{ fontSize: 52, filter: "grayscale(0.3)" }}>{e}</span>
            <div style={S.faixaOverlay} />
          </div>
        ))}
      </div>

      {/* ── DIFERENCIAIS ── */}
      <section style={S.diferenciais}>
        <p style={S.difLabel}>Por que Guilucca?</p>
        <h2 style={S.difTitle}>
          Feito com amor,
          <br />entregue com orgulho.
        </h2>

        <div style={S.difGrid}>
          {DIFERENCIAIS.map((d, i) => (
            <div
              key={i}
              style={{
                ...S.difCard,
                ...(hoveredCard === i ? S.difCardHover : {}),
              }}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={S.difCardAccent} />
              <span style={S.difEmoji}>{d.emoji}</span>
              <h3 style={S.difCardTitle}>{d.title}</h3>
              <p style={S.difCardText}>{d.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section>
        <div style={S.ctaStrip} />
        <div style={S.ctaSection}>
          <h2 style={S.ctaTitle}>
            Pronto pra pedir?
          </h2>
          <p style={S.ctaSub}>
            Escolha seu favorito, informe onde entregar e deixa o resto com a gente.
          </p>
          <a
            href={LINK_CARDAPIO}
            style={{
              ...S.ctaBtn,
              ...(ctaBtnHover ? { transform: "translateY(-2px)", boxShadow: `0 8px 40px ${VERMELHO}66` } : {}),
            }}
            className="cta-btn"
            onMouseEnter={() => setCtaBtnHover(true)}
            onMouseLeave={() => setCtaBtnHover(false)}
          >
            Abrir o cardápio →
          </a>
        </div>
      </section>

      {/* ── RODAPÉ ── */}
      <footer>
        <div style={{ ...S.footer, width: "100%" }} className="footer-inner">
          <div style={S.footerLogo}>GUILUCCA BAGUETTES & CIA</div>
          <div style={S.footerLinks}>
            <a
              href="https://instagram.com/guilucca_br"
              target="_blank"
              rel="noreferrer"
              style={S.footerLink}
            >
              @guilucca_br
            </a>
            <a
              href="https://wa.me/5511993374373"
              target="_blank"
              rel="noreferrer"
              style={S.footerLink}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
