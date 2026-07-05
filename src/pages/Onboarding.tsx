import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { Button, Logo } from "../components/mobile/kit";
import { Icon } from "../components/mobile/Icon";

export default function Onboarding() {
  const t = useTheme();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  function finish() {
    localStorage.setItem("sm_onboarded", "1");
    navigate("/login", { replace: true });
  }

  const slides: { eyebrow: string; title: string; copy: string; art: ReactNode }[] = [
    {
      eyebrow: "Pedí",
      title: "Sin vueltas,\nsin grupos\nde WhatsApp",
      copy: "Describí el trabajo, recibí cotizaciones, chateá y agendá. Todo dentro de la app.",
      art: (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", top: 40, left: 40, padding: "12px 16px", background: t.surface, borderRadius: 18, borderTopLeftRadius: 4, boxShadow: t.shadow, fontFamily: t.fontBody, fontSize: 13, color: t.ink, maxWidth: 200 }}>
            Hola, necesito instalar un calefón.
          </div>
          <div style={{ position: "absolute", top: 105, right: 30, padding: "12px 16px", background: t.green, borderRadius: 18, borderTopRightRadius: 4, color: "#fff", fontFamily: t.fontBody, fontSize: 13, maxWidth: 200 }}>
            ¡Hola! Mañana 14-16hs te queda?
          </div>
          <div style={{ position: "absolute", top: 170, right: 24, padding: 14, background: t.surface, borderRadius: 16, borderTopRightRadius: 4, boxShadow: t.shadow, fontFamily: t.fontBody, maxWidth: 230, border: `1px solid ${t.greenSoft}` }}>
            <div style={{ fontSize: 11, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontWeight: 700 }}>Cotización</div>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 26, fontWeight: 700, color: t.ink }}>$28.500</div>
            <div style={{ fontSize: 12, color: t.inkMute, marginTop: 4 }}>Mano de obra + materiales</div>
          </div>
        </div>
      ),
    },
    {
      eyebrow: "Tranquilo",
      title: "Pagás dentro\nde la app",
      copy: "MercadoPago integrado. Confirmás cuando el trabajo está listo. Cada calificación viene de un trabajo real.",
      art: (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", top: 40, left: 30, right: 30, padding: 20, background: t.surfaceDeep, borderRadius: 22, color: "#fff", fontFamily: t.fontBody }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Pago seguro</span>
              <Icon name="shield" size={18} color="#fff" />
            </div>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>$28.500</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 12, opacity: 0.7 }}>
              <span>•••• 3704</span><span>Pagado</span>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 30, left: 30, right: 30, padding: "14px 16px", background: t.surface, borderRadius: 16, boxShadow: t.shadow, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, background: t.greenSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="check" size={20} color={t.green} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 13, color: t.ink }}>Trabajo confirmado</div>
              <div style={{ fontFamily: t.fontBody, fontSize: 11.5, color: t.inkMute, marginTop: 1 }}>Dejá tu calificación</div>
            </div>
            <Icon name="star" size={20} color={t.star} />
          </div>
        </div>
      ),
    },
  ];

  const slide = slides[idx];
  const isLast = idx === slides.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, background: t.bg, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ padding: "54px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size={22} />
        {!isLast && <button onClick={finish} style={{ all: "unset", cursor: "pointer", fontFamily: t.fontBody, fontSize: 14, color: t.inkMute, fontWeight: 600 }}>Saltar</button>}
      </div>
      <div style={{ flex: 1, position: "relative", margin: "20px 8px 0" }}>{slide.art}</div>
      <div style={{ padding: "0 24px 24px" }}>
        <div style={{ fontFamily: t.fontMono, fontSize: 11, color: t.green, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600, marginBottom: 12 }}>{slide.eyebrow}</div>
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 38, lineHeight: 1.05, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em", whiteSpace: "pre-line" }}>{slide.title}</h1>
        <p style={{ marginTop: 14, fontFamily: t.fontBody, fontSize: 15, color: t.inkMute, lineHeight: 1.5, marginBottom: 28 }}>{slide.copy}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {slides.map((_, i) => (
              <div key={i} style={{ height: 6, width: i === idx ? 22 : 6, borderRadius: 6, background: i === idx ? t.ink : t.line, transition: "all .3s" }} />
            ))}
          </div>
          <Button variant={isLast ? "green" : "primary"} size="lg" onClick={() => (isLast ? finish() : setIdx(idx + 1))} iconRight={<Icon name="arrow-right" size={18} color={t.accentInk} />}>
            {isLast ? "Empezar" : "Siguiente"}
          </Button>
        </div>
      </div>
      <div style={{ height: 34 }} />
    </div>
  );
}
