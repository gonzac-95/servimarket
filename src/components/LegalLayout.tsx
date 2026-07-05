import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export default function LegalLayout({ title, updatedAt, children }: LegalLayoutProps) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-3 h-16">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <Link to="/" className="font-bold text-lg text-gradient">ServiMarket</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-sm text-gray-400 mb-8">Última actualización: {updatedAt}</p>
        <div className="legal-prose space-y-6 text-sm text-gray-700 leading-relaxed">
          {children}
        </div>
      </main>
    </div>
  );
}

// Sub-componentes de ayuda para mantener consistencia tipográfica
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
