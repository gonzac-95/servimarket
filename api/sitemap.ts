// /sitemap.xml (vercel.json lo reescribe a /api/sitemap).
// Incluye las páginas públicas, los rubros, rubro × ciudad donde hay
// prestadores verificados, y el perfil de cada prestador verificado.
import { PROVIDER_SELECT, SEO_CATEGORIES, SITE_URL, slugify, type PublicProvider, supabaseGet } from "./_shared.js";

type Entry = { loc: string; changefreq: string; priority: string; lastmod?: string };

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const entries: Entry[] = [
    { loc: "/home", changefreq: "daily", priority: "1.0" },
    { loc: "/register", changefreq: "monthly", priority: "0.6" },
    { loc: "/help", changefreq: "monthly", priority: "0.4" },
    { loc: "/terminos", changefreq: "yearly", priority: "0.2" },
    { loc: "/privacidad", changefreq: "yearly", priority: "0.2" },
  ];
  for (const c of SEO_CATEGORIES) entries.push({ loc: `/servicios/${c.id}`, changefreq: "daily", priority: "0.9" });

  const providers = (await supabaseGet<PublicProvider[]>(
    `providers?select=${PROVIDER_SELECT}&documents_verified=eq.true&is_available=eq.true&limit=5000`,
  )) ?? [];

  const combos = new Set<string>();
  for (const p of providers) {
    if (p.users?.is_blocked) continue;
    entries.push({ loc: `/provider/${p.id}`, changefreq: "weekly", priority: "0.7", lastmod: p.created_at?.slice(0, 10) });
    const citySlug = p.users?.city ? slugify(p.users.city) : "";
    if (!citySlug) continue;
    for (const dbName of p.categories ?? []) {
      const cat = SEO_CATEGORIES.find(c => c.dbName === dbName);
      if (cat) combos.add(`/servicios/${cat.id}/${citySlug}`);
    }
  }
  for (const loc of [...combos].sort()) entries.push({ loc, changefreq: "daily", priority: "0.8" });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url><loc>${SITE_URL}${e.loc}</loc><lastmod>${e.lastmod ?? today}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`).join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
