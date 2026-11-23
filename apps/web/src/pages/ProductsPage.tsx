import { prepareProductImage } from "../stores/product-images";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { Category } from "@appsoft/domain/catalog";
import { priceToCents } from "@appsoft/domain/catalog";
import { validateProduct } from "@appsoft/domain/products";
import type { ManagedProduct } from "@appsoft/domain/products";
import { formatMoney } from "@appsoft/domain";
import { useAuth } from "../auth/AuthProvider";
import { request } from "../stores/service";
import { StoreLayout } from "../stores/components/StoreLayout";
import "./ProductsPage.css";
const money = (value: number | null | undefined) => value == null ? "" : (value / 100).toFixed(2);
function ProductEditor({ product, categories, storeId, onSaved, onCancel }: { product: ManagedProduct | null; categories: Category[]; storeId: string; onSaved: () => void; onCancel: () => void }) {
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [imageUrl, setImageUrl] = useState("");
  const [variants, setVariants] = useState(product?.variants || []);
  const [shipping, setShipping] = useState(product?.shipping_mode || "arrange");
  const [category, setCategory] = useState(product?.category_id || "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const categoryPath = (c: Category): string => { const parent = categories.find(p => p.id === c.parent_id); return parent ? `${categoryPath(parent)} / ${c.name}` : c.name; };
  async function upload(files: FileList | null) {
    if (!files) return;
    setUploading(true); setError("");
    try {
      if (images.length + files.length > 8) throw new Error("Use até 8 fotos.");
      const added: string[] = [];
      for (const file of Array.from(files)) {
        added.push(await prepareProductImage(file));
      }
      setImages(previous => [...previous,...added]);
    } catch(error) { setError((error as Error).message); } finally { setUploading(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || uploading) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || "");
    const optionalNumber = (key: string) => text(key) ? Number(text(key)) : null;
    try {
      const input = validateProduct({ name: text("name"), description: text("description"), category_id: category,
        price_cents: priceToCents(text("price")), promotion_price_cents: priceToCents(text("promotion")),
        active: form.get("active") === "on", stock: Number(text("stock")), sku: text("sku"), brand: text("brand"),
        shipping_mode: shipping, shipping_price_cents: shipping === "fixed" ? priceToCents(text("freight")) : null,
        shipping_notes: text("shipping_notes"), delivery_days: optionalNumber("delivery_days"), weight_grams: optionalNumber("weight_grams"), images, variants });
      setBusy(true);
      await request(`/api/stores/${storeId}/products${product ? `/${product.id}` : ""}`,{ method: product ? "PUT" : "POST", body: JSON.stringify(input) }); onSaved();
    } catch(error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <section className="panel-card product-editor"><h2>{product ? "Editar produto" : "Novo produto"}</h2><p>Preencha os dados e salve como rascunho ou ative para disponibilizar no catélogo da loja.</p><form className="form" onSubmit={submit}><fieldset disabled={busy || uploading}>
    <h3>Informações do produto</h3><label>Nome do produto<input name="name" defaultValue={product?.name} required minLength={3} maxLength={160} /></label>
    <label>Descrição completa<textarea name="description" rows={6} defaultValue={product?.description} required minLength={10} maxLength={6000} placeholder="Características, materiais, medidas, conteúdo da embalagem e cuidados." /></label>
    <div className="product-form-grid"><label>Marca<input name="brand" maxLength={100} defaultValue={product?.brand} /></label><label>Código interno (SKU)<input name="sku" maxLength={64} defaultValue={product?.sku} /></label></div>
    <label>Categoria e subcategoria<select required value={category} onChange={e=>setCategory(e.target.value)}><option value="">Selecione</option>{categories.map(c=><option key={c.id} value={c.id}>{categoryPath(c)}</option>)}</select><small>Escolha o nível mais específico. O produto também aparece nos filtros das categorias superiores.</small></label>
    <h3>Preço e promoção</h3><div className="product-form-grid"><label>Preço normal (R$)<input name="price" inputMode="decimal" defaultValue={money(product?.price_cents)} required placeholder="99,90" /></label><label>Preço promocional (R$)<input name="promotion" inputMode="decimal" defaultValue={money(product?.promotion_price_cents)} placeholder="Opcional" /><small>Deve ser menor que o preço normal. Para encerrar a promoção, deixe vazio.</small></label></div>
    <h3>Fotos</h3><p>A primeira foto é a capa. Até 8 fotos; JPG, PNG ou WebP. Os arquivos enviados são redimensionados automaticamente para até 1000 pixels e comprimidos para até 100 KB por foto.</p><label>Enviar fotos<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{ void upload(e.target.files); e.target.value=""; }} /></label>
    <div className="product-image-input"><label>Ou adicionar foto por link HTTPS<input type="url" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} /></label><button type="button" className="button secondary" disabled={images.length >= 8 || !imageUrl} onClick={()=>{setImages([...images,imageUrl.trim()]);setImageUrl("");}}>Adicionar foto</button></div>
    <div className="product-image-list">{images.map((url,i)=><div key={`${i}-${url.slice(-30)}`}><img decoding="async" src={url} alt={`Foto ${i+1}`} /><span>{i===0 ? "Capa" : `Foto ${i+1}`}</span><button type="button" disabled={i===0} onClick={()=>setImages([url,...images.filter((_,index)=>index!==i)])}>Usar como capa</button><button type="button" onClick={()=>setImages(images.filter((_,index)=>index!==i))}>Remover foto {i+1}</button></div>)}</div>
    <h3>Estoque e variações</h3><label>Estoque geral<input name="stock" type="number" min={0} max={1000000} defaultValue={product?.stock || 0} disabled={variants.length>0} /><small>Ao usar variações, o estoque é controlado em cada uma delas.</small></label>
    {variants.map((v,i)=><div className="product-variant-row" key={i}><label>Tamanho ou variação {i+1}<input value={v.size} required maxLength={20} onChange={e=>setVariants(variants.map((row,j)=>j===i ? {...row,size:e.target.value}:row))} placeholder="P, 42, Azul..." /></label><label>Estoque da variação {i+1}<input type="number" min={0} max={1000000} required value={v.stock} onChange={e=>setVariants(variants.map((row,j)=>j===i ? {...row,stock:Number(e.target.value)}:row))} /></label><button type="button" onClick={()=>setVariants(variants.filter((_,j)=>j!==i))}>Remover variação {i+1}</button></div>)}
    <button className="button secondary" type="button" disabled={variants.length>=50} onClick={()=>setVariants([...variants,{size:"",stock:0}])}>Adicionar variação</button>
    <h3>Frete e entrega</h3><label>Forma de entrega<select value={shipping} onChange={e=>setShipping(e.target.value as typeof shipping)}><option value="arrange">A combinar com a loja</option><option value="free">Frete grátis</option><option value="fixed">Frete fixo</option><option value="pickup">Retirada na loja</option></select></label>
    {shipping === "fixed" && <label>Frete informado por produto (R$)<input name="freight" required inputMode="decimal" defaultValue={money(product?.shipping_price_cents)} /></label>}
    <div className="product-form-grid"><label>Prazo estimado (dias úteis)<input name="delivery_days" type="number" min={1} max={365} defaultValue={product?.delivery_days || ""} /></label><label>Peso embalado (gramas)<input name="weight_grams" type="number" min={1} max={1000000} defaultValue={product?.weight_grams || ""} /></label></div>
    <label>Condições de entrega<textarea name="shipping_notes" rows={3} maxLength={1000} defaultValue={product?.shipping_notes} placeholder="Regiões atendidas, condições do frete e instruções para retirada." /></label><small>Estas informações serão exibidas no produto. O total de frete da compra ainda depende do checkout.</small>
    <h3>Publicação</h3><label className="product-active"><input type="checkbox" name="active" defaultChecked={product?.active || false} /> Ativar produto</label><p>Para ativar, informe foto e estoque. A exibição pública também exige loja aprovada e assinatura vigente.</p>
    {error && <p className="notice error" role="alert">{error}</p>}<div className="product-actions"><button className="button primary" disabled={busy || uploading}>{busy ? "Salvando…" : uploading ? "Preparando fotos…" : "Salvar produto"}</button><button type="button" className="button secondary" onClick={onCancel}>Cancelar</button></div>
  </fieldset></form></section>;
}
export default function ProductsPage() {
  const { storeId = "" } = useParams(); const { session } = useAuth();
  const [data,setData] = useState<{products:ManagedProduct[];categories:Category[]} | null>(null);
  const [error,setError] = useState(""); const [notice,setNotice] = useState(""); const [attempt,setAttempt] = useState(0);
  const [editor,setEditor] = useState<ManagedProduct | null | undefined>(undefined);
  const [search,setSearch] = useState(""); const [status,setStatus] = useState("all");
  useEffect(()=>{ document.title="Produtos da loja · AppSoft"; },[]);
  useEffect(()=>{ if (!session) return; const controller=new AbortController(); setData(null);setError("");
    void request<{products:ManagedProduct[];categories:Category[]}>(`/api/stores/${storeId}/products`,{signal:controller.signal}).then(result=>{if(!controller.signal.aborted)setData(result);}).catch(error=>{if(!controller.signal.aborted)setError(error.message);});
    return ()=>controller.abort();
  },[storeId,session?.user.id,attempt]);
  if (!session) return <Navigate to="/login" replace />;
  const products=data?.products.filter(p=>(status==="all" || p.active===(status==="active")) && `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())) || [];
  return <StoreLayout><Link className="back-link" to="/minhas-lojas">Voltar para minhas lojas</Link><div className="page-heading-row"><div><p className="eyebrow">ÁREA DO LOJISTA</p><h1>Produtos da loja</h1><p>{data?.products.filter(p=>p.active).length || 0} de 50 produtos ativos</p></div>{editor===undefined && <button className="button primary" onClick={()=>{setEditor(null);setNotice("");}} disabled={!data}>Cadastrar produto</button>}</div>
    {notice && <p className="notice success" role="status">{notice}</p>}{error ? <div><p className="notice error" role="alert">{error}</p><button className="button secondary" onClick={()=>setAttempt(a=>a+1)}>Tentar novamente</button></div> : !data ? <p role="status">Carregando produtos…</p> : editor!==undefined ? <ProductEditor key={editor?.id || "new"} product={editor} categories={data.categories} storeId={storeId} onCancel={()=>setEditor(undefined)} onSaved={()=>{setEditor(undefined);setNotice("Produto salvo com sucesso.");setAttempt(a=>a+1);}} /> : <>
    <div className="product-form-grid"><label>Buscar por nome ou código<input type="search" value={search} onChange={e=>setSearch(e.target.value)} /></label><label>Situação<select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Todos</option><option value="active">Ativos</option><option value="draft">Rascunhos / inativos</option></select></label></div>
    {products.length ? <div className="managed-products">{products.map(p=><article className="panel-card managed-product" key={p.id}>{p.images[0] && <img decoding="async" src={p.images[0]} alt={p.name} loading="lazy" />}<div><span className={`status-badge ${p.active ? "approved":"pending"}`}>{p.active ? "Ativo":"Rascunho / inativo"}</span><h2>{p.name}</h2>{p.promotion_price_cents && <del>{formatMoney(p.price_cents)}</del>}<strong>{formatMoney(p.promotion_price_cents || p.price_cents)}</strong><p>Estoque: {p.variants.length ? p.variants.reduce((sum,v)=>sum+v.stock,0) : p.stock}{p.sku ? ` · Código: ${p.sku}` : ""}</p><button className="button secondary" onClick={()=>{setEditor(p);setNotice("");}}>Editar {p.name}</button></div></article>)}</div> : <section className="panel-card"><h2>{data.products.length ? "Nenhum produto encontrado" : "Cadastre seu primeiro produto"}</h2><p>Organize o catélogo da loja com fotos, preços e informações completas.</p></section>}</>}
  </StoreLayout>;
}
