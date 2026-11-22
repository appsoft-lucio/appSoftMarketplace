import { lazy, Suspense } from "react";

const CatalogPage = lazy(() => import("./CatalogPage"));

export default function HomePage() {
  return <Suspense fallback={<main className="loading-screen" role="status">Carregando produtos…</main>}><CatalogPage home /></Suspense>;
}