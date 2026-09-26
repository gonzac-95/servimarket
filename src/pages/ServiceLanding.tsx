// ServiceLanding.tsx — páginas por rubro para buscadores:
//   /servicios/gasista            → gasistas de todo el país
//   /servicios/gasista/rosario    → gasistas en Rosario
// Reusa el buscador con el rubro (y la ciudad) fijados por la URL.
import { useParams } from "react-router-dom";
import { seoCategory } from "../lib/seo";
import Search from "./Search";
import NotFound from "./NotFound";

export default function ServiceLanding() {
  const { rubro, ciudad } = useParams();
  if (!seoCategory(rubro)) return <NotFound />;
  // key: al cambiar de rubro/ciudad se remonta limpio (filtros y resultados)
  return <Search key={`${rubro}/${ciudad ?? ""}`} presetCategory={rubro} citySlug={ciudad?.toLowerCase()} />;
}
