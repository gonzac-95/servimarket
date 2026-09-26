// Las funciones de Vercel (api/_shared.ts) tienen su copia de rubros y slugify.
// Este test avisa si quedan distintas de las de la web.
import { describe, expect, it } from "vitest";
import { SEO_CATEGORIES, slugify } from "./seo";
import { CATEGORIES } from "./categories";
import * as api from "../../api/_shared";

describe("SEO: web y funciones de Vercel sincronizadas", () => {
  it("mismos rubros, textos y nombres en la base", () => {
    expect(api.SEO_CATEGORIES.map(c => ({ id: c.id, plural: c.plural, singular: c.singular })))
      .toEqual(SEO_CATEGORIES.map(c => ({ id: c.id, plural: c.plural, singular: c.singular })));
    expect(api.SEO_CATEGORIES.map(c => [c.id, c.dbName])).toEqual(CATEGORIES.map(c => [c.id, c.dbName]));
  });
  it("slugify igual en los dos lados", () => {
    for (const s of ["Rosario", "Villa Gobernador Gálvez", "San Nicolás de los Arroyos", "Córdoba ", "CABA"]) {
      expect(api.slugify(s)).toBe(slugify(s));
    }
    expect(slugify("Villa Gobernador Gálvez")).toBe("villa-gobernador-galvez");
  });
});
