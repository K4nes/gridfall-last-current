export const VIEW_W = 640;
export const VIEW_H = 360;
export const SCALE = 2;
export const OUT_W = VIEW_W * SCALE;
export const OUT_H = VIEW_H * SCALE;

export function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return c;
}

export function sprite(w, h, draw) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  threshold(c);
  return c;
}

export function threshold(canvas) {
  const ctx = canvas.getContext("2d");
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] < 128) {
      d[i] = 0;
      d[i - 1] = 0;
      d[i - 2] = 0;
      d[i - 3] = 0;
    } else {
      d[i] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function pixelCircle(ctx, cx, cy, r, color, opts = {}) {
  const { dash = 0, phase = 0, thickness = 1 } = opts;
  const steps = Math.max(12, Math.ceil(r * 6.4));
  ctx.fillStyle = color;
  for (let i = 0; i < steps; i++) {
    if (dash && (i + phase) % dash >= dash / 2) continue;
    const a = (i / steps) * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), thickness, thickness);
  }
}

export function pixelArc(ctx, cx, cy, r, a0, a1, color) {
  const steps = Math.max(4, Math.ceil(Math.abs(a1 - a0) * r));
  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
  }
}

export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

export function pxline(ctx, x0, y0, x1, y1, color, size = 1) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const dx = Math.abs(Math.round(x1) - x);
  const dy = Math.abs(Math.round(y1) - y);
  const sx = x < Math.round(x1) ? 1 : -1;
  const sy = y < Math.round(y1) ? 1 : -1;
  let err = dx - dy;
  for (let i = 0; i < 400; i++) {
    rect(ctx, x - (size >> 1), y - (size >> 1), size, size, color);
    if (x === Math.round(x1) && y === Math.round(y1)) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

export class PixelCanvas {
  constructor(display) {
    this.low = makeCanvas(VIEW_W, VIEW_H);
    this.ctx = this.low.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.display = display;
    this.scale = 2;
    this.resize(1280, 720);
  }
  resize(width, height) {
    this.display.width = Math.max(VIEW_W, Math.round(width));
    this.display.height = Math.max(VIEW_H, Math.round(height));
    this.out = this.display.getContext("2d");
    this.out.imageSmoothingEnabled = false;
  }
  present() {
    this.out.imageSmoothingEnabled = false;
    this.out.drawImage(this.low, 0, 0, this.display.width, this.display.height);
  }
}
