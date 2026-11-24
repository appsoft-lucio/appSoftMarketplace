import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BrandLink } from "./BrandLink";
import "./SiteHeader.css";

export function SiteHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 16);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <header className={`site-header${scrolled ? " site-header-scrolled" : ""}`}><BrandLink /><div className="site-header-actions">{children}</div></header>;
}
