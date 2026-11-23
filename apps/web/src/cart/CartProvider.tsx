import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cartKey, parseCart, readSavedCart } from "@appsoft/domain/cart";
import type { CartItem, PublicProduct } from "@appsoft/domain/cart";
export const CART_STORAGE_KEY = "appsoft.cart.v1";
interface CartState {
  items: CartItem[]; count: number; storageWarning: boolean;
  add: (product: PublicProduct, size: string | null, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  consume: (purchased: CartItem[]) => void;
}
const Context = createContext<CartState | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => { try { return readSavedCart(localStorage.getItem(CART_STORAGE_KEY)); } catch { return []; } });
  const [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items })); setStorageWarning(false); }
    catch { setStorageWarning(true); }
  }, [items]);
  useEffect(() => {
    const listener = (event: StorageEvent) => { if (event.key === CART_STORAGE_KEY || event.key === null) setItems(readSavedCart(event.newValue)); };
    window.addEventListener("storage", listener); return () => window.removeEventListener("storage", listener);
  }, []);
  const add = (product: PublicProduct, size: string | null, quantity = 1) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Quantidade inválida.");
    const stock = product.variants.length ? product.variants.find(variant => variant.size === size)?.stock || 0 : size ? 0 : product.stock;
    if (!stock) throw new Error(product.variants.length ? "Selecione um tamanho disponível." : "Produto indisponível.");
    const key = cartKey({ productId: product.id, size });
    const existing = items.find(item => cartKey(item) === key);
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > Math.min(stock, 99)) throw new Error("A quantidade desejada não está disponível.");
    const next = existing ? items.map(item => cartKey(item) === key ? { ...item, quantity: nextQuantity } : item) : [...items, { productId: product.id, size, quantity }];
    setItems(parseCart(next));
  };
  const setQuantity = (key: string, quantity: number) => setItems(parseCart(items.map(item => cartKey(item) === key ? { ...item, quantity } : item)));
  const remove = (key: string) => setItems(previous=>previous.filter(item => cartKey(item) !== key));
  const consume = (purchased: CartItem[]) => setItems(previous=>previous.flatMap(item=>{
    const bought=purchased.find(line=>cartKey(line)===cartKey(item));
    if(!bought)return [item];
    return item.quantity>bought.quantity ? [{...item,quantity:item.quantity-bought.quantity}] : [];
  }));
  return <Context.Provider value={{ items, count: items.reduce((sum, item) => sum + item.quantity, 0), storageWarning, add, setQuantity, remove, consume }}>{children}</Context.Provider>;
}
export function useCart() { const cart = useContext(Context); if (!cart) throw new Error("CartProvider ausente."); return cart; }
