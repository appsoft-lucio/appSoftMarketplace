import { afterEach, expect, it, vi } from "vitest";
import { prepareProductImage } from "../src/stores/product-images";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("reduz fotos grandes mantendo a proporção e tenta comprimir até 100 KB", async () => {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 4000, height: 2000, close }));
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillStyle: "", fillRect: vi.fn(), drawImage } as unknown as CanvasRenderingContext2D);
  const dimensions: number[][] = [];
  let attempts = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback) {
    dimensions.push([this.width, this.height]);
    callback(new Blob([new Uint8Array(++attempts === 1 ? 300000 : 100000)], { type: "image/webp" }));
  });
  const result = await prepareProductImage(new Blob(["photo"], { type: "image/png" }));
  expect(result.startsWith("data:image/webp;base64,")).toBe(true);
  expect(dimensions).toEqual([[1000, 500], [1000, 500]]);
  expect(close).toHaveBeenCalledOnce();
});

it("usa JPEG se o navegador não consegue codificar WebP e não amplia fotos pequenas", async () => {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 300, height: 200, close }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  const formats: string[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback, format) {
    expect([this.width,this.height]).toEqual([300,200]);
    formats.push(format!);
    callback(new Blob([new Uint8Array(1000)],{type:format === "image/webp" ? "image/png" : "image/jpeg"}));
  });
  expect(await prepareProductImage(new Blob(["photo"],{type:"image/png"}))).toMatch(/^data:image\/jpeg;base64,/);
  expect(formats).toEqual(["image/webp","image/jpeg"]);
  expect(close).toHaveBeenCalledOnce();
});

it("libera a imagem decodificada mesmo quando a compressão falha", async () => {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 300, height: 200, close }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype,"toBlob").mockImplementation(callback=>callback(null));
  await expect(prepareProductImage(new Blob(["photo"],{type:"image/png"}))).rejects.toThrow("comprimir");
  expect(close).toHaveBeenCalledOnce();
});

it("reduz mais as dimensões quando baixar a qualidade não basta", async () => {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 2000, height: 4000, close }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  const dimensions: number[][] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback) {
    dimensions.push([this.width, this.height]);
    callback(new Blob([new Uint8Array(this.height > 900 ? 300000 : 100000)], { type: "image/webp" }));
  });
  await prepareProductImage(new Blob(["photo"], { type: "image/webp" }));
  expect(dimensions).toEqual([[500,1000],[500,1000],[500,1000],[400,800]]);
  expect(close).toHaveBeenCalledOnce();
});
