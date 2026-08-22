// Avatar builder — part catalog + layout transforms.
// Each part is a transparent PNG under /public/avatars/parts.
// `w`/`x` are % of the preview width; `top` is % of the preview height.
// Coordinates were calibrated by compositing the parts over the base body
// (see the debug composites), using a 300x525 portrait preview box.

export type PartKind = "body" | "top" | "bottom" | "accessory";

export type PartDef = {
  id: string;
  kind: PartKind;
  label: string;
  src: string;
  w: number;   // width as % of preview width
  x: number;   // left offset % (centered = 50 minus w/2)
  top: number; // top offset % of preview height
};

const BODY_W = 48, BODY_X = 26;

export const PARTS: PartDef[] = [
  // Bodies
  { id: "male", kind: "body", label: "Pria", src: "/avatars/parts/male-base-p.png", w: 50, x: 25, top: 0 },
  { id: "female", kind: "body", label: "Wanita", src: "/avatars/parts/female-base-p.png", w: 50, x: 25, top: 0 },
  // Tops
  { id: "shirt-black", kind: "top", label: "Hoodie Hitam", src: "/avatars/parts/garment-shirt-black-p.png", w: 60, x: 20, top: 24.5 },
  { id: "shirt-black-red", kind: "top", label: "Hoodie Merah", src: "/avatars/parts/garment-shirt-black-red.png", w: 60, x: 20, top: 24.5 },
  { id: "shirt-black-blue", kind: "top", label: "Hoodie Biru", src: "/avatars/parts/garment-shirt-black-blue.png", w: 60, x: 20, top: 24.5 },
  { id: "shirt-red", kind: "top", label: "Jaket Merah", src: "/avatars/parts/garment-shirt-red-p.png", w: 58, x: 21, top: 23 },
  { id: "shirt-suit", kind: "top", label: "Jas", src: "/avatars/parts/garment-shirt-suit-p.png", w: 56, x: 22, top: 22 },
  { id: "shirt-suit-navy", kind: "top", label: "Jas Navy", src: "/avatars/parts/garment-shirt-suit-navy.png", w: 56, x: 22, top: 22 },
  // Bottoms
  { id: "pants-black", kind: "bottom", label: "Celana Hitam", src: "/avatars/parts/garment-pants-black-p.png", w: 35, x: 32.5, top: 50 },
  { id: "pants-denim", kind: "bottom", label: "Denim", src: "/avatars/parts/garment-pants-denim.png", w: 35, x: 32.5, top: 50 },
  { id: "pants-khaki", kind: "bottom", label: "Khaki", src: "/avatars/parts/garment-pants-khaki.png", w: 35, x: 32.5, top: 50 },
  { id: "pants-cargo", kind: "bottom", label: "Cargo", src: "/avatars/parts/garment-pants-cargo-p.png", w: 37, x: 31.5, top: 50 },
  { id: "pants-cargo-gray", kind: "bottom", label: "Cargo Abu", src: "/avatars/parts/garment-pants-cargo-gray.png", w: 37, x: 31.5, top: 50 },
  // Accessories
  { id: "acc-glasses", kind: "accessory", label: "Kacamata", src: "/avatars/parts/accessory-glasses-p.png", w: 23, x: 38.5, top: 9 },
  { id: "acc-headphones", kind: "accessory", label: "Headphone", src: "/avatars/parts/accessory-headphones-p.png", w: 28, x: 36, top: 2 },
  { id: "acc-cap", kind: "accessory", label: "Topi", src: "/avatars/parts/accessory-cap-p.png", w: 27, x: 36.5, top: -1 },
];

export type AvatarConfig = {
  body: string;
  top: string;
  bottom: string;
  accessory: string;
};

export function part(id: string): PartDef | undefined {
  return PARTS.find((p) => p.id === id);
}

export function defaultConfig(): AvatarConfig {
  return { body: "male", top: "shirt-red", bottom: "pants-black", accessory: "acc-glasses" };
}

// Render config -> PNG data URL on a fixed portrait canvas for saving as avatar.
export async function renderAvatarDataUrl(cfg: AvatarConfig, size = 300): Promise<string> {
  const order: PartKind[] = ["body", "accessory", "top", "bottom"];
  const parts = order.map((k) => part((cfg as unknown as Record<string, string>)[k])).filter(Boolean) as PartDef[];

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round(size * 1.75); // matches preview aspect ratio
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#050707");
  grad.addColorStop(1, "#111415");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const load = (src: string): Promise<HTMLImageElement> =>
    new Promise((res, rej) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = rej; im.src = src; });

  for (const p of parts) {
    const img = await load(p.src);
    const w = canvas.width * (p.w / 100);
    const h = img.height * (w / img.width);
    const x = canvas.width * (p.x / 100);
    const y = canvas.height * (p.top / 100);
    ctx.drawImage(img, x, y, w, h);
  }
  return canvas.toDataURL("image/png");
}
