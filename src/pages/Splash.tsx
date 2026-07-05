import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";

export default function Splash() {
  const t = useTheme();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const id = setTimeout(() => {
      if (loading) return;
      if (user) navigate("/home", { replace: true });
      else if (!localStorage.getItem("sm_onboarded")) navigate("/onboarding", { replace: true });
      else navigate("/login", { replace: true });
    }, 1800);
    return () => clearTimeout(id);
  }, [user, loading, navigate]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: `linear-gradient(160deg, ${t.greenDeep} 0%, #052E16 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fade-in .35s ease",
    }}>
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: 999, background: "radial-gradient(closest-side, rgba(34,197,94,0.45), transparent)", top: "20%" }} />
      <div style={{ position: "relative", zIndex: 1, animation: "float 3s ease-in-out infinite" }}>
        <div style={{
          width: 96, height: 96, borderRadius: 26, background: `linear-gradient(135deg, ${t.greenBright}, ${t.greenDeep})`,
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 60px -10px rgba(34,197,94,0.5)",
        }}>
          <svg width="62" height="62" viewBox="0 0 120 120" fill="none">
            <path d="M 22 56 L 60 22 L 98 56 L 98 94 a4 4 0 0 1 -4 4 L 26 98 a4 4 0 0 1 -4 -4 Z" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
            <path d="M 76 50 Q 76 44 70 44 L 52 44 Q 44 44 44 52 Q 44 60 52 62 L 68 64 Q 78 66 78 74 Q 78 82 70 82 L 42 82" fill="none" stroke="#fff" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div style={{ marginTop: 28, fontFamily: t.fontDisplay, fontSize: 38, color: "#fff", fontWeight: 700, letterSpacing: "-0.02em" }}>
        Servi<span style={{ color: t.greenBright }}>Market</span>
      </div>
      <div style={{ marginTop: 10, fontFamily: t.fontBody, fontSize: 14, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Servicios del hogar · Argentina
      </div>
    </div>
  );
}
