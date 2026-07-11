import { useState } from "react";

// Imagens hospedadas no Supabase Storage do Guilucca (bucket "logos")
const IMG_LOGO     = "https://rydjpazvhnbgpyzfuroa.supabase.co/storage/v1/object/public/logos/logo-1783193088005-e3w4zc.jpg";
const IMG_HERO     = "https://rydjpazvhnbgpyzfuroa.supabase.co/storage/v1/object/public/logos/Forno_1.png";
const IMG_QUEIJOS   = "https://rydjpazvhnbgpyzfuroa.supabase.co/storage/v1/object/public/logos/Baguete_2.png";
const IMG_LINGUICA  = "https://rydjpazvhnbgpyzfuroa.supabase.co/storage/v1/object/public/logos/Calabresa_1.jpg";

const VERMELHO = "#E8453C";
const AMARELO  = "#F5A623";
const CARVAO   = "#1A1A1A";
const CARVAO2  = "#242424";
const BRANCO   = "#FFFFFF";

const SABORES = [
  { img: IMG_QUEIJOS,  nome: "Dois Queijos",        desc: "Mussarela e requeijão cremoso" },
  { img: IMG_LINGUICA, nome: "Calabresa com Queijo",  desc: "Defumada, dourada no forno" },
];

export default function LandingPage() {
  const [hovBtn, setHovBtn] = useState(false);
  const [hovCta, setHovCta] = useState(false);
  const [hovCard, setHovCard] = useState(null);
  const [logoOk, setLogoOk] = useState(true);

  const LINK = "/cardapio";

  return (
    <div style={{ fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif", background:CARVAO, color:BRANCO, minHeight:"100vh", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes badgePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.65)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .hi1{ animation:fadeUp .7s ease both; }
        .hi2{ animation:fadeUp .7s .14s ease both; }
        .hi3{ animation:fadeUp .7s .26s ease both; }
        @media(max-width:640px){
          .prod-grid{ grid-template-columns:1fr !important; }
          .dif-grid{ grid-template-columns:1fr !important; }
          .footer-row{ flex-direction:column !important; align-items:flex-start !important; gap:14px !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position:"relative", minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"flex-end", overflow:"hidden" }}>

        <img src={IMG_HERO} alt="Baguete Guilucca" style={{
          position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"cover", objectPosition:"center 40%", zIndex:0,
        }}/>

        <div style={{ position:"absolute", inset:0, zIndex:1,
          background:`linear-gradient(to top, ${CARVAO} 30%, ${CARVAO}bb 52%, transparent 100%)` }}/>

        <div aria-hidden style={{
          position:"absolute", top:"44%", left:"50%", transform:"translate(-50%,-50%)",
          fontSize:"clamp(60px,16vw,200px)", fontWeight:900, letterSpacing:"-0.04em",
          color:BRANCO, opacity:.04, whiteSpace:"nowrap", userSelect:"none", zIndex:2, lineHeight:1,
        }}>ARTESANAL</div>

        {/* Logo */}
        {logoOk && (
          <div style={{ position:"absolute", top:20, left:20, zIndex:4 }}>
            <img
              src={IMG_LOGO}
              alt="Guilucca Baguettes & Cia"
              onError={() => setLogoOk(false)}
              style={{ height:90, filter:"drop-shadow(0 2px 8px rgba(0,0,0,.5))" }}
            />
          </div>
        )}

        {/* Conteúdo hero */}
        <div style={{ position:"relative", zIndex:3, padding:"0 28px 68px", maxWidth:700 }}>
          <div className="hi1" style={{
            display:"inline-flex", alignItems:"center", gap:8, marginBottom:24,
            background:VERMELHO, color:BRANCO, fontSize:11, fontWeight:700,
            letterSpacing:"0.18em", textTransform:"uppercase",
            padding:"6px 14px", borderRadius:4,
          }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:AMARELO,
              animation:"badgePulse 1.8s ease-in-out infinite" }}/>
            Pedidos abertos agora
          </div>

          <h1 className="hi2" style={{
            fontSize:"clamp(42px,9vw,84px)", fontWeight:900,
            lineHeight:1.0, letterSpacing:"-0.03em", margin:"0 0 20px",
          }}>
            Sabor que você<br/>
            <span style={{ color:AMARELO }}>sente na primeira</span><br/>
            mordida.
          </h1>

          <p className="hi3" style={{
            fontSize:"clamp(15px,2vw,18px)", color:"rgba(255,255,255,.65)",
            lineHeight:1.65, maxWidth:440, margin:"0 0 38px",
          }}>
            Baguetes artesanais, salgadas e doces, feitas com carinho.
            Peça pelo cardápio digital — fácil, rápido, direto pra cozinha.
          </p>

          <a href={LINK} style={{
            display:"inline-flex", alignItems:"center", gap:10,
            background:AMARELO, color:CARVAO, fontWeight:800, fontSize:16,
            padding:"17px 34px", borderRadius:8, textDecoration:"none",
            boxShadow: hovBtn ? `0 8px 32px ${AMARELO}66` : `0 4px 24px ${AMARELO}44`,
            transform: hovBtn ? "translateY(-3px)" : "none",
            transition:"transform .15s, box-shadow .15s",
          }}
            onMouseEnter={() => setHovBtn(true)}
            onMouseLeave={() => setHovBtn(false)}
          >
            Ver cardápio
            <span style={{ fontSize:20, display:"inline-block",
              transform:hovBtn?"translateX(5px)":"none", transition:"transform .2s" }}>→</span>
          </a>
        </div>
      </section>

      {/* ── SABORES (2 fotos lado a lado) ── */}
      <section style={{ padding:"72px 24px", maxWidth:900, margin:"0 auto" }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.2em",
          textTransform:"uppercase", color:VERMELHO, marginBottom:8 }}>Nossos sabores</p>
        <h2 style={{ fontSize:"clamp(26px,5vw,44px)", fontWeight:900,
          letterSpacing:"-0.02em", marginBottom:44, lineHeight:1.15 }}>
          Cada mordida conta<br/>uma história.
        </h2>

        <div className="prod-grid" style={{
          display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:18, marginBottom:40,
        }}>
          {SABORES.map((p,i) => (
            <div key={i}
              onMouseEnter={() => setHovCard(i)}
              onMouseLeave={() => setHovCard(null)}
              style={{
                borderRadius:14, overflow:"hidden", background:CARVAO2,
                border: hovCard===i ? `1px solid ${AMARELO}66` : "1px solid rgba(255,255,255,.07)",
                transform: hovCard===i ? "translateY(-4px)" : "none",
                boxShadow: hovCard===i ? "0 12px 40px rgba(0,0,0,.5)" : "none",
                transition:"transform .2s, border-color .2s, box-shadow .2s",
              }}>
              <div style={{ height:200, overflow:"hidden" }}>
                <img src={p.img} alt={p.nome} style={{
                  width:"100%", height:"100%", objectFit:"cover",
                  transform: hovCard===i ? "scale(1.06)" : "scale(1)",
                  transition:"transform .35s",
                }}/>
              </div>
              <div style={{ padding:"16px 18px 20px" }}>
                <div style={{ height:3, borderRadius:2, marginBottom:12,
                  background:`linear-gradient(90deg,${VERMELHO},${AMARELO})`,
                  opacity: hovCard===i ? 1 : 0.4, transition:"opacity .2s" }}/>
                <p style={{ fontWeight:800, fontSize:16, marginBottom:5 }}>{p.nome}</p>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.5)", lineHeight:1.55 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* "Feito na hora" — texto, sem foto extra */}
        <div style={{
          background:CARVAO2, borderRadius:14, padding:"26px 24px",
          border:"1px solid rgba(255,255,255,.07)", borderTop:`3px solid ${AMARELO}`,
        }}>
          <h3 style={{ fontWeight:800, fontSize:20, marginBottom:8 }}>Feito na hora</h3>
          <p style={{ fontSize:14, color:"rgba(255,255,255,.55)", lineHeight:1.6 }}>
            Cada baguete é montada e assada com cuidado artesanal.
          </p>
        </div>
      </section>

      {/* ── DIFERENCIAIS ── */}
      <section style={{ padding:"0 24px 72px", maxWidth:900, margin:"0 auto" }}>
        <div className="dif-grid" style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20,
        }}>
          {[
            { emoji:"🫓", title:"Artesanal de verdade",
              text:"Massa semi-folhada feita com ingredientes selecionados. Cada baguete sai do forno no ponto certo." },
            { emoji:"📍", title:"Atendemos Grande ABC",
              text:"Santo André, São Bernardo, São Caetano e região. Peça e receba sem sair do trabalho." },
            { emoji:"⚡", title:"Peça em segundos",
              text:"Cardápio digital, sem ligação, sem fila. Escolhe, envia e aguarda o sabor chegar até você." },
          ].map((d,i) => (
            <div key={i} style={{
              background:CARVAO2, borderRadius:12, padding:"26px 22px",
              border:`1px solid rgba(255,255,255,.07)`,
              borderTop:`3px solid ${i===0?VERMELHO:i===1?AMARELO:"rgba(255,255,255,.2)"}`,
            }}>
              <span style={{ fontSize:32, display:"block", marginBottom:14 }}>{d.emoji}</span>
              <h3 style={{ fontWeight:800, fontSize:17, marginBottom:8, letterSpacing:"-0.01em" }}>{d.title}</h3>
              <p style={{ fontSize:14, color:"rgba(255,255,255,.5)", lineHeight:1.6 }}>{d.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ textAlign:"center", padding:"0 24px 80px", maxWidth:580, margin:"0 auto" }}>
        <div style={{ height:1,
          background:`linear-gradient(90deg,transparent,${VERMELHO},${AMARELO},transparent)`,
          opacity:.35, marginBottom:64 }}/>
        <h2 style={{ fontSize:"clamp(28px,6vw,50px)", fontWeight:900,
          letterSpacing:"-0.02em", lineHeight:1.1, marginBottom:16 }}>
          Pronto pra pedir?
        </h2>
        <p style={{ fontSize:16, color:"rgba(255,255,255,.5)", marginBottom:36, lineHeight:1.6 }}>
          Escolha seu favorito, informe onde entregar<br/>e deixa o resto com a gente.
        </p>
        <a href={LINK} style={{
          display:"inline-flex", alignItems:"center", gap:10,
          background:VERMELHO, color:BRANCO, fontWeight:800, fontSize:16,
          padding:"18px 40px", borderRadius:8, textDecoration:"none",
          boxShadow: hovCta ? `0 8px 40px ${VERMELHO}66` : `0 4px 28px ${VERMELHO}44`,
          transform: hovCta ? "translateY(-3px)" : "none",
          transition:"transform .15s, box-shadow .15s",
        }}
          onMouseEnter={() => setHovCta(true)}
          onMouseLeave={() => setHovCta(false)}
        >
          Abrir o cardápio →
        </a>
      </section>

      {/* ── RODAPÉ ── */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,.07)", padding:"28px 24px" }}>
        <div className="footer-row" style={{
          maxWidth:900, margin:"0 auto",
          display:"flex", justifyContent:"space-between", alignItems:"center", gap:16,
        }}>
          <span style={{ fontWeight:900, fontSize:14, letterSpacing:"0.05em", color:"rgba(255,255,255,.5)" }}>
            GUILUCCA BAGUETTES & CIA
          </span>
          <div style={{ display:"flex", gap:24, alignItems:"center" }}>
            <a href="https://instagram.com/guilucca_br" target="_blank" rel="noreferrer"
              style={{ fontSize:13, color:"rgba(255,255,255,.4)", textDecoration:"none" }}>
              @guilucca_br
            </a>
            <a href="https://wa.me/5511993374373" target="_blank" rel="noreferrer"
              style={{ fontSize:13, color:"rgba(255,255,255,.4)", textDecoration:"none" }}>
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
