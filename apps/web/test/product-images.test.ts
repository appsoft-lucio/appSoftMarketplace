import { afterEach, expect, it, vi } from "vitest";
import { prepareProductImage } from "../src/stores/product-images";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("reduz fotos grandes mantendo a proporção e tenta comprimir até 200 KB", async () => {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 4000, height: 2000, close }));
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillStyle: "", fillRect: vi.fn(), drawImage } as unknown as CanvasRenderingContext2D);
  const dimensions: number[][] = [];
  let attempts = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback) {
    dimensions.push([this.width, this.height]);
    callback(new Blob([new Uint8Array(++attempts === 1 ? 300000 : 100000)], { type: "image/jpeg" }));
  });
  const result = await prepareProductImage(new Blob(["photo"], { type: "image/png" }));
  expect(result.startsWith("data:image/jpeg;base64,")).toBe(true);
  expect(dimensions).toEqual([[1200, 600], [1200, 600]]);
  expect(close).toHaveBeenCalledOnce();
});

it("reduz mais as dimensões quando baixar a qualidade não basta", async () => {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 2000, height: 4000, close }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  const dimensions: number[][] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback) {
    dimensions.push([this.width, this.height]);
    callback(new Blob([new Uint8Array(this.height > 1000 ? 300000 : 100000)], { type: "image/jpeg" }));
  });
  await prepareProductImage(new Blob(["photo"], { type: "image/jpeg" }));
  expect(dimensions).toEqual([[600,1200],[600,1200],[600,1200],[480,960]]);
  expect(close).toHaveBeenCalledOnce();
});
