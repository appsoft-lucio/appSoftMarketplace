import { Link } from "react-router-dom";
import { useAppearance } from "./AppearanceProvider";

export function CatalogIntro() {
  const { theme } = useAppearance();
  if (theme !== "christmas") return <div className="catalog-intro"><p className="eyebrow">EXPLORE O COMÉRCIO LOCAL</p><h1>Encontre o que combina com você.</h1><p>Escolha a categoria e refine a busca do seu jeito.</p></div>;
  return <section className="christmas-campaign" aria-labelledby="christmas-title">
    <div className="christmas-hero">
      <div className="christmas-hero-copy">
        <p className="christmas-kicker"><span aria-hidden="true">✦</span> NATAL NO COMÉRCIO LOCAL</p>
        <h1 id="christmas-title">Mais carinho em cada presente.<br /><em>Mais Natal perto de você.</em></h1>
        <p>Encontre presentes nas lojas da sua região e aproveite as promoções disponíveis com escolhas que cabem no seu bolso.</p>
        <div className="christmas-actions"><a className="button christmas-cta" href="#catalog-products">Explorar presentes <span aria-hidden="true">↗</span></a></div>
        <p className="christmas-note">Preços, estoque e condições variam conforme cada loja.</p>
      </div>
      <div className="christmas-art" aria-hidden="true">
        <span className="christmas-art-star">✦</span><span className="christmas-art-spark">✧</span>
        <span className="christmas-ornament" />
        <span className="christmas-gift christmas-gift-back" /><span className="christmas-gift christmas-gift-front" />
        <span className="christmas-art-label">PRESENTEAR É<br /><strong>estar perto.</strong></span>
      </div>
    </div>
    <div className="christmas-budget"><strong>Um presente para cada orçamento</strong><div><Link to="/catalogo?max=50&sort=price_asc">Até R$ 50</Link><Link to="/catalogo?max=100&sort=price_asc">Até R$ 100</Link><Link to="/catalogo?max=300&sort=price_asc">Até R$ 300</Link><Link to="/catalogo?max=500&sort=price_asc">Até R$ 500</Link></div></div>
  </section>;
}
