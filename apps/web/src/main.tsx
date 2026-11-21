import React from "react";
import { createRoot } from "react-dom/client";
import { BASIC_PLAN, formatMoney } from "@appsoft/domain";
import logo from "../../../imagens/logo-appsoft-orange-semFundo.png";
import "./style.css";

function App() {
  return (
    <main>
      <img src={logo} alt="AppSoft" />
      <p className="eyebrow">MARKETPLACE</p>
      <h1>Um novo começo para o comércio local.</h1>
      <p>Estamos preparando um espaço para conectar lojas e compradores.</p>
      <section aria-label="Plano inicial para lojistas">
        <h2>Plano {BASIC_PLAN.name}</h2>
        <p><strong>{formatMoney(BASIC_PLAN.monthlyPriceCents)}</strong> por mês</p>
        <p>Até {BASIC_PLAN.activeProductLimit} produtos ativos por loja. Sem comissão por venda.</p>
      </section>
      <small>Em construção. Cadastros, assinaturas e compras ainda não estão disponíveis.</small>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Elemento raiz não encontrado.");
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
