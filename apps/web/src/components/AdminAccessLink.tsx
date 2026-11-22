import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../stores/admin-service";
export function AdminAccessLink() {
  const [role, setRole] = useState<string>("");
  useEffect(() => {
    const controller = new AbortController();
    void adminService.profile(controller.signal).then(data => { if (!controller.signal.aborted) setRole(data.role); }).catch(() => { if (!controller.signal.aborted) setRole("unavailable"); });
    return () => controller.abort();
  }, []);
  if (role === "admin") return <section className="account-card"><p className="eyebrow">ADMINISTRAÇÃO</p><h2>Gestão do marketplace</h2><p>Analise os cadastros e acompanhe as lojas da plataforma.</p><Link className="button primary" to="/admin">Abrir painel administrativo</Link></section>;
  if (role === "unavailable") return <p className="fine-print">Não foi possível consultar as permissões administrativas. <Link to="/admin">Verificar acesso</Link></p>;
  return null;
}