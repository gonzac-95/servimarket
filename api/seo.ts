// /api/seo — versión "prerenderizada" para buscadores y previews de links.
//
// vercel.json manda acá SÓLO a los bots (Googlebot, WhatsApp, Facebook, etc.)
// cuando piden /, /home, /servicios/... o /provider/:id. Devolvemos el mismo
// index.html de la web, pero con título, descripción, Open Graph, datos
// estructurados (JSON-LD) y el contenido principal ya escrito dentro de
// #root. Al ejecutar el JS, React reemplaza ese contenido por la app normal,
// así que el bot ve lo mismo que una persona.
import {
  PROVIDER_SELECT, SEO_CATEGORIES, SITE_URL, escapeHtml as esc, slugify, unslugify,
  type PublicProvider, supabaseGet,
} from "./_shared";

const DEFAULT_TITLE = "ServiMarket · Profesionales verificados para tu casa";
const DEFAULT_DESC = "Encontrá gasistas, electricistas, plomeros y más, con DNI verificado y reseñas de trabajos reales. Pedí presupuesto y coordiná todo en un solo lugar.";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

interface Page {
  status: number;
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  jsonLd: object[];
  body: string;
}

let shellCache: { html: string; at: number } | null = null;
async function loadShell(origin: string): Promise<string | null> {
  if (shellCache && Date.now() - shellCache.at < 5 * 60_000) return shellCache.html;
  try {
    const res = await fetch(`${origin}/index.html`, { headers: { "user-agent": "servimarket-seo" } });
    if (!res.ok) return null;
    const html = await res.text();
    shellCache = { html, at: Date.now() };
    return html;
  } catch {
    return null;
  }
}

const catOf = (dbName?: string | null) => SEO_CATEGORIES.find(c => c.dbName === dbName);
const stars = (p: PublicProvider) =>
  p.reviews_count ? `${Number(p.rating_avg ?? 0).toFixed(1)} ★ (${p.reviews_count} reseña${p.reviews_count === 1 ? "" : "s"})` : "Nuevo en ServiMarket";

function providerItem(p: PublicProvider): string {
  const cat = catOf(p.categories?.[0]);
  return `<li><a href="/provider/${esc(p.id)}">${esc(p.users?.name ?? "Prestador")}</a> — ${esc(cat?.singular ?? "profesional")}${p.users?.city ? ` en ${esc(p.users.city)}` : ""} · ${esc(stars(p))}</li>`;
}

function categoryLinks(citySlug?: string, cityName?: string): string {
  return `<nav><h2>Servicios${cityName ? ` en ${esc(cityName)}` : ""}</h2><ul>${SEO_CATEGORIES.map(c =>
    `<li><a href="/servicios/${c.id}${citySlug ? `/${citySlug}` : ""}">${esc(c.plural)}${cityName ? ` en ${esc(cityName)}` : ""}</a></li>`).join("")}</ul></nav>`;
}

const ORG_LD = {
  "@context": "https://schema.org", "@type": "Organization", name: "ServiMarket", url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`, areaServed: "AR",
};

async function homePage(): Promise<Page> {
  return {
    status: 200, title: DEFAULT_TITLE, description: DEFAULT_DESC, path: "/home",
    jsonLd: [ORG_LD, { "@context": "https://schema.org", "@type": "WebSite", name: "ServiMarket", url: SITE_URL, inLanguage: "es-AR" }],
    body: `<main><h1>Profesionales verificados para tu casa</h1><p>${esc(DEFAULT_DESC)}</p>${categoryLinks()}<p><a href="/register?role=provider">Sumate como prestador</a></p></main>`,
  };
}

async function servicePage(rubro: string, ciudad?: string): Promise<Page | null> {
  const cat = SEO_CATEGORIES.find(c => c.id === rubro);
  if (!cat) return null;
  const rows = await supabaseGet<PublicProvider[]>(
    `providers?select=${PROVIDER_SELECT}&documents_verified=eq.true&is_available=eq.true` +
    `&categories=cs.${encodeURIComponent(`{"${cat.dbName}"}`)}&order=rating_avg.desc.nullslast,reviews_count.desc&limit=300`,
  );
  if (rows === null) throw new Error("supabase no disponible");
  const all = rows.filter(p => !p.users?.is_blocked);

  const citySlug = ciudad ? slugify(ciudad) : undefined;
  const inCity = citySlug ? all.filter(p => p.users?.city && slugify(p.users.city) === citySlug) : all;
  const cityName = citySlug ? (inCity[0]?.users?.city ?? unslugify(citySlug)) : undefined;
  const list = inCity.slice(0, 30);

  const title = cityName ? `${cat.plural} en ${cityName}` : `${cat.plural} verificados`;
  const description = `Encontrá un ${cat.singular} en ${cityName ?? "tu zona"} con DNI verificado y reseñas de trabajos reales. Pedí presupuesto gratis y coordiná todo por ServiMarket.`;
  const path = `/servicios/${cat.id}${citySlug ? `/${citySlug}` : ""}`;

  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ServiMarket", item: `${SITE_URL}/home` },
      { "@type": "ListItem", position: 2, name: cat.plural, item: `${SITE_URL}/servicios/${cat.id}` },
      ...(cityName ? [{ "@type": "ListItem", position: 3, name: cityName, item: `${SITE_URL}${path}` }] : []),
    ],
  };
  const itemList = {
    "@context": "https://schema.org", "@type": "ItemList", name: title,
    itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/provider/${p.id}`, name: p.users?.name ?? "Prestador" })),
  };

  return {
    status: 200, title, description, path,
    // Ciudad sin prestadores: la página existe (para no romper links) pero no se indexa
    noindex: !!citySlug && inCity.length === 0,
    jsonLd: list.length ? [breadcrumb, itemList] : [breadcrumb],
    body: `<main><h1>${esc(title)}</h1><p>${esc(description)}</p>` +
      (list.length ? `<ul>${list.map(providerItem).join("")}</ul>` : `<p>Todavía no hay prestadores verificados${cityName ? ` en ${esc(cityName)}` : ""}.</p>`) +
      categoryLinks(inCity.length ? citySlug : undefined, inCity.length ? cityName : undefined) + `</main>`,
  };
}

async function providerPage(id: string): Promise<Page | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await supabaseGet<PublicProvider[]>(`providers?select=${PROVIDER_SELECT}&id=eq.${id}&limit=1`);
  if (rows === null) throw new Error("supabase no disponible");
  const p = rows[0];
  if (!p || p.users?.is_blocked) return null;
  const reviews = (await supabaseGet<{ rating: number; comment: string | null; created_at: string }[]>(
    `reviews?select=rating,comment,created_at&provider_id=eq.${id}&order=created_at.desc&limit=5`,
  )) ?? [];

  const name = p.users?.name ?? "Prestador";
  const cat = catOf(p.categories?.[0]);
  const catLabel = cat ? cat.singular[0].toUpperCase() + cat.singular.slice(1) : "Profesional";
  const city = p.users?.city ?? undefined;
  const title = `${name} · ${catLabel}${city ? ` en ${city}` : ""}`;
  const description = (p.bio?.trim().slice(0, 150)) ||
    `${catLabel}${city ? ` en ${city}` : ""} con DNI verificado en ServiMarket. ${stars(p)}. Pedí presupuesto sin cargo.`;

  const business: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "HomeAndConstructionBusiness",
    name, url: `${SITE_URL}/provider/${p.id}`, description,
    ...(p.users?.avatar_url ? { image: p.users.avatar_url } : {}),
    ...(city ? { address: { "@type": "PostalAddress", addressLocality: city, ...(p.users?.province ? { addressRegion: p.users.province } : {}), addressCountry: "AR" } } : {}),
    ...(p.reviews_count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(p.rating_avg ?? 0).toFixed(1), reviewCount: p.reviews_count, bestRating: 5, worstRating: 1 } } : {}),
  };

  const servicesHtml = (p.categories ?? []).map(db => catOf(db)).filter(Boolean)
    .map(c => `<li><a href="/servicios/${c!.id}${city ? `/${slugify(city)}` : ""}">${esc(c!.plural)}${city ? ` en ${esc(city)}` : ""}</a></li>`).join("");

  return {
    status: 200, title, description, path: `/provider/${p.id}`,
    image: p.users?.avatar_url ?? undefined,
    noindex: !p.documents_verified,
    jsonLd: [business],
    body: `<main><h1>${esc(name)}</h1><p>${esc(catLabel)}${city ? ` en ${esc(city)}` : ""} · ${p.documents_verified ? "DNI verificado" : "En verificación"} · ${esc(stars(p))}</p>` +
      (p.bio ? `<p>${esc(p.bio)}</p>` : "") +
      (servicesHtml ? `<h2>Servicios</h2><ul>${servicesHtml}</ul>` : "") +
      (reviews.length ? `<h2>Reseñas</h2><ul>${reviews.map(r => `<li>${"★".repeat(Math.round(r.rating))}${r.comment ? ` — ${esc(r.comment)}` : ""}</li>`).join("")}</ul>` : "") +
      `<p><a href="/provider/${esc(p.id)}">Pedir presupuesto</a></p></main>`,
  };
}

function render(shell: string, page: Page): string {
  const fullTitle = page.title === DEFAULT_TITLE ? page.title : `${page.title} · ServiMarket`;
  const url = `${SITE_URL}${page.path}`;
  const image = page.image || OG_IMAGE;
  const head = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    page.noindex ? `<meta name="robots" content="noindex, nofollow" />` : "",
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="ServiMarket" />`,
    `<meta property="og:locale" content="es_AR" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="${page.image ? "summary" : "summary_large_image"}" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    ...page.jsonLd.map(ld => `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`),
  ].filter(Boolean).join("\n    ");

  return shell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/i, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/i, "")
    .replace("</head>", `    ${head}\n  </head>`)
    .replace(/<div id="root"><\/div>/, `<div id="root">${page.body}</div>`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const shell = await loadShell(url.origin);
  if (!shell) return new Response("Servicio no disponible", { status: 503 });

  let page: Page | null = null;
  let failed = false;
  try {
    if (kind === "provider") page = await providerPage(url.searchParams.get("id") ?? "");
    else if (kind === "servicio") page = await servicePage(url.searchParams.get("rubro") ?? "", url.searchParams.get("ciudad") ?? undefined);
    else page = await homePage();
  } catch (e) {
    console.error("seo render failed", e);
    failed = true;
  }

  // Si algo falla o no existe: la web normal (con 404 si corresponde)
  const html = page ? render(shell, page) : shell;
  return new Response(html, {
    status: page ? page.status : failed ? 200 : 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Si falló la base no se cachea, para reintentar en el próximo pedido
      "Cache-Control": failed ? "no-store" : "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
