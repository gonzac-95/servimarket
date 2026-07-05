import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { Icon } from "../components/mobile/Icon";
import { MobileScreen } from "../components/mobile/MobileScreen";

const FAQS: { q: string; a: string }[] = [
  {
    q: "¿Cómo pido un servicio?",
    a: "Buscá un prestador por categoría o nombre, entrá a su perfil y tocá \"Pedir presupuesto\". Contale qué necesitás (con fotos si podés) y te responde con una cotización dentro de la app.",
  },
  {
    q: "¿Cómo y cuándo pago?",
    a: "El pago se hace con MercadoPago dentro de la app, una vez que aceptaste la cotización. Confirmás el trabajo cuando está terminado a tu satisfacción. Nunca pagues por afuera: el pago por la app es tu respaldo.",
  },
  {
    q: "¿Las reseñas son reales?",
    a: "Sí. Solo puede dejar reseña un cliente que pagó y confirmó el trabajo dentro de ServiMarket. No hay reseñas inventadas.",
  },
  {
    q: "¿Qué pasa si el trabajo sale mal?",
    a: "Antes de confirmar, usá el botón \"Algo no está bien\" en el chat del trabajo para resolverlo con el prestador. Si no llegan a un acuerdo, escribinos a soporte y mediamos.",
  },
  {
    q: "¿Cómo me hago prestador?",
    a: "Creá una cuenta eligiendo \"Soy prestador\" y completá tu perfil: categorías, zona, descripción y lista de precios. Cuanto más completo tu perfil, más clientes te encuentran.",
  },
  {
    q: "¿Cuánto cobra ServiMarket?",
    a: "Para el cliente el precio es el cotizado, sin recargos. Al prestador se le descuenta una comisión fija según el monto del trabajo, que ve claramente antes de cotizar.",
  },
  {
    q: "¿Cómo elimino mi cuenta?",
    a: "Desde Perfil → \"Eliminar mi cuenta\". Se borran tus datos personales de forma permanente. También podés pedirlo escribiendo a soporte.",
  },
];

export default function Help() {
  const t = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "54px 16px 8px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="arrow-left" size={20} color={t.ink} />
          </button>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 24, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em" }}>Centro de ayuda</h1>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 40px" }}>
          <div style={{ background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, overflow: "hidden" }}>
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? `1px solid ${t.lineSoft}` : "none" }}>
                  <button onClick={() => setOpen(isOpen ? null : i)} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "15px 16px" }}>
                    <span style={{ flex: 1, fontFamily: t.fontBody, fontSize: 14.5, fontWeight: isOpen ? 700 : 600, color: t.ink }}>{f.q}</span>
                    <span style={{ display: "flex", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
                      <Icon name="chevron-right" size={16} color={t.inkSoft} />
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", fontFamily: t.fontBody, fontSize: 13.5, color: t.inkMute, lineHeight: 1.55 }}>{f.a}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* contacto */}
          <div style={{ marginTop: 20, padding: 18, background: t.surfaceDeep, borderRadius: t.radius, color: "#fff" }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: 700 }}>¿No encontraste tu respuesta?</div>
            <div style={{ fontFamily: t.fontBody, fontSize: 12.5, opacity: 0.7, marginTop: 4, lineHeight: 1.5 }}>Escribinos y te respondemos lo antes posible.</div>
            <a href="mailto:soporte@servimarket.com" style={{ textDecoration: "none", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 46, background: t.green, borderRadius: t.radiusSm, fontFamily: t.fontBody, fontSize: 14, fontWeight: 700, color: "#fff" }}>
              <Icon name="chat" size={17} color="#fff" /> soporte@servimarket.com
            </a>
          </div>
        </div>
      </div>
    </MobileScreen>
  );
}
