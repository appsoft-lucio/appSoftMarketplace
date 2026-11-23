import { Link } from "react-router-dom";
import logo from "../../../../../imagens/logo-appsoft-orange-semFundo.png";

export function BrandLink() {
  return <Link to="/" aria-label="AppSoft, início"><img src={logo} alt="AppSoft" /></Link>;
}
