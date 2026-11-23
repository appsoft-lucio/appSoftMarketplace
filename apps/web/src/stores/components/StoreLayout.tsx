import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../../components/layout/SiteHeader";

export function StoreLayout({ children }: { children: ReactNode }) {
  return <div className="site-shell"><SiteHeader><Link className="button secondary" to="/minha-conta">Minha conta</Link></SiteHeader><main className="page-content">{children}</main></div>;
}
