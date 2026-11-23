export interface ProductInput {
  name: string; description: string; category_id: string; price_cents: number;
  promotion_price_cents: number | null; active: boolean; stock: number; sku: string; brand: string;
  shipping_mode: "arrange" | "free" | "fixed" | "pickup"; shipping_price_cents: number | null;
  shipping_notes: string; delivery_days: number | null; weight_grams: number | null;
  images: string[]; variants: Array<{ size: string; stock: number }>;
}
export interface ManagedProduct extends ProductInput { id: string; store_id: string }
export const productUuid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export function validateProduct(value: unknown): ProductInput {
  if (!value || typeof value !== "object") throw new Error("Produto inválido.");
  const v = value as Record<string, unknown>;
  const text = (key: string, min: number, max: number) => {
    if (typeof v[key] !== "string") throw new Error(`Campo ${key} inválido.`);
    const s = (v[key] as string).trim();
    if (s.length < min || s.length > max) throw new Error(`Campo ${key}: informe entre ${min} e ${max} caracteres.`);
    return s;
  };
  const integer = (value: unknown, min: number, max: number, label: string) => {
    if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) throw new Error(`${label} inválido.`);
    return value;
  };
  const price = integer(v.price_cents, 1, 999999999, "Preço");
  const promotion = v.promotion_price_cents === null ? null : integer(v.promotion_price_cents, 1, price - 1, "Preço promocional");
  const category = text("category_id", 36, 36);
  if (!productUuid.test(category)) throw new Error("Selecione uma categoria v?lida.");
  if (typeof v.active !== "boolean") throw new Error("Situação inválida.");
  if (!["arrange", "free", "fixed", "pickup"].includes(String(v.shipping_mode))) throw new Error("Entrega inválida.");
  if (!Array.isArray(v.images) || v.images.length > 8) throw new Error("Use até 8 fotos.");
  const images = v.images.map(raw => {
    if (typeof raw !== "string" || raw.length > 1400000) throw new Error("Foto inválida.");
    if (raw.startsWith("data:image/jpeg;base64,")) {
      const base64 = raw.slice(23);
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0 || !base64.startsWith("/9j/")) throw new Error("Foto JPEG inválida.");
      return raw;
    }
    if (raw.startsWith("data:image/webp;base64,")) {
      const base64 = raw.slice(23);
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0 || base64.length > Math.ceil(100 * 1024 / 3) * 4) throw new Error("Foto WebP inválida ou maior que 100 KB.");
      const header = atob(base64.slice(0, 16));
      if (!header.startsWith("RIFF") || header.slice(8, 12) !== "WEBP") throw new Error("Foto WebP inválida.");
      return raw;
    }
    let url: URL; try { url = new URL(raw); } catch { throw new Error("Informe uma URL v?lida para a foto."); }
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("As fotos devem usar HTTPS.");
    return url.href;
  });
  if (images.reduce((sum, image) => sum + image.length, 0) > 3 * 1024 * 1024) throw new Error("As fotos juntas excedem 3 MB. Use imagens menores ou links HTTPS.");
  if (!Array.isArray(v.variants) || v.variants.length > 50) throw new Error("Use até 50 variações.");
  const variants = v.variants.map(raw => {
    if (!raw || typeof raw !== "object" || typeof raw.size !== "string" || !raw.size.trim() || raw.size.trim().length > 20) throw new Error("Nome da variação inválido.");
    return { size: raw.size.trim(), stock: integer(raw.stock, 0, 1000000, "Estoque da variação") };
  });
  if (new Set(variants.map(v => v.size.toLowerCase())).size !== variants.length) throw new Error("Existem variações repetidas.");
  const stock = integer(v.stock, 0, 1000000, "Estoque");
  if (v.active && (!images.length || (variants.length ? !variants.some(v => v.stock > 0) : stock === 0))) throw new Error("Para ativar, adicione uma foto e estoque disponível.");
  return { name: text("name", 3, 160), description: text("description", 10, 6000), category_id: category,
    price_cents: price, promotion_price_cents: promotion, active: v.active, stock: variants.length ? 0 : stock,
    sku: text("sku", 0, 64), brand: text("brand", 0, 100), shipping_mode: v.shipping_mode as ProductInput["shipping_mode"],
    shipping_price_cents: v.shipping_mode === "fixed" ? integer(v.shipping_price_cents, 1, 999999999, "Frete") : null,
    shipping_notes: text("shipping_notes", 0, 1000), delivery_days: v.delivery_days === null ? null : integer(v.delivery_days, 1, 365, "Prazo"),
    weight_grams: v.weight_grams === null ? null : integer(v.weight_grams, 1, 1000000, "Peso"), images, variants };
}
