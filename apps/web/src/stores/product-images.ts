const MAX_SIDE = 1000;
const MAX_BYTES = 100 * 1024;

/** Reduce dimensions and encoded size before a photo enters the product form. */
export async function prepareProductImage(file: Blob): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error("Use JPG, PNG ou WebP de até 10 MB.");
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  try {
    if (!bitmap.width || !bitmap.height) throw new Error("A foto está vazia ou inválida.");
    let side = MAX_SIDE;
    while (side >= 300) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Não foi possível preparar a foto.");
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.72, 0.62]) {
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(value => value ? resolve(value) : reject(new Error("Não foi possível comprimir a foto.")), "image/webp", quality);
        });
        // Browsers without WebP encoding can return PNG; fall back to compressed JPEG.
        const encoded = blob.type === "image/webp" ? blob : await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(value => value ? resolve(value) : reject(new Error("Não foi possível comprimir a foto.")), "image/jpeg", quality);
        });
        if (encoded.size <= MAX_BYTES) {
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Não foi possível ler a foto."));
            reader.readAsDataURL(encoded);
          });
        }
      }
      side = Math.floor(side * 0.8);
    }
    throw new Error("Não foi possível reduzir a foto para 100 KB. Escolha outra imagem.");
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
