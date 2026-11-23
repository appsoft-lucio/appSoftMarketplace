import { Link } from "react-router-dom";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count } = useCart();
  return <Link className="button secondary" to="/carrinho">Carrinho ({count})</Link>;
}
