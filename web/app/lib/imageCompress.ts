export type CompressOptions = {
  maxSize?: number;
  preferTransparent?: boolean;
  jpegQuality?: number;
};

/**
 * data: URL を Blob に変換（fetch を使わない・CSP セーフ）。
 *
 * 本サイトの CSP では connect-src に data: を含めていないため、
 * `fetch(dataUrl)` を使うとブロックされて画像処理に失敗する。
 * この関数は完全にローカルAPI（atob + Uint8Array + Blob）で変換する。
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] ?? "image/png";
  const binary = atob(base64);
  const len = binary.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<string> {
  const { maxSize = 800, preferTransparent = true, jpegQuality = 0.86 } = opts;

  const isVector = file.type === "image/svg+xml";
  if (isVector) {
    return await fileToDataUrl(file);
  }

  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width <= maxSize && height <= maxSize) {
    if (file.size < 200 * 1024) {
      return dataUrl;
    }
  }

  const ratio = Math.min(maxSize / width, maxSize / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const hasAlpha = file.type === "image/png" || file.type === "image/webp";
  if (hasAlpha && preferTransparent) {
    return canvas.toDataURL("image/png");
  }
  return canvas.toDataURL("image/jpeg", jpegQuality);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("read failed"));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}
