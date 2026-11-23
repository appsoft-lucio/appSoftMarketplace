import type { ReactNode } from "react";
import { BrandLink } from "./BrandLink";
import "./SiteHeader.css";

export function SiteHeader({ children }: { children: ReactNode }) {
  return <header className="site-header"><BrandLink /><div className="site-header-actions">{children}</div></header>;
}
