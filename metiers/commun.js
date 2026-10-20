// Briques communes aux modules métiers (aucun prix ici).
export const D = "2026-09-28";
export const mk = (ref, label, cat, unit, pricing, price, extra = {}) => ({ id: ref, ref, label, cat, unit, pricing, price, cost: null, priceDate: price === null ? null : D, supplier: "", brand: "", yield: null, yieldUnit: "m²", tags: [], pack: "", ...extra });
export const rent = (o = {}) => ({ day: null, week: null, month: null, setup: null, teardown: null, setupPerM2: null, teardownPerM2: null, transport: null, minDays: null, setupIncluded: false, ...o });
export const need = (v, what) => (v > 0 ? {} : { unknown: what + " à renseigner" });
export const hasN = (v) => typeof v === "number" && isFinite(v);
