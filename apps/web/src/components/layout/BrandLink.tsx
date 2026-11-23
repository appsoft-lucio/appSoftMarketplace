import { Link } from "react-router-dom";
import logo from "../../../../../imagens/logo-appsoft-small.png";

export function BrandLink() {
  return <Link to="/" aria-label="AppSoft, início"><img src={logo} alt="AppSoft" decoding="async" /></Link>;
}
