import { P } from "./palette.js";
import { sprite, rect } from "../rendering/pixel-canvas.js";

let CACHE = null;

export function coreSprite() {
  if (CACHE) return CACHE;
  CACHE = sprite(64, 64, (ctx) => {
    ctx.fillStyle = "#0d1318";
    ctx.beginPath();
    ctx.arc(32, 32, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.steel;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(32, 32, 25, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = 32 + Math.cos(a) * 20;
      const y = 32 + Math.sin(a) * 20;
      rect(ctx, Math.round(x) - 2, Math.round(y) - 3, 4, 6, P.steel);
      rect(ctx, Math.round(x) - 2, Math.round(y) - 3, 4, 1, P.steelHi);
    }

    ctx.fillStyle = "#101a20";
    ctx.beginPath();
    ctx.arc(32, 32, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.steelHi;
    ctx.beginPath();
    ctx.arc(32, 32, 14, 0, Math.PI * 2);
    ctx.stroke();

    rect(ctx, 28, 20, 8, 4, "#2b3a44");
    rect(ctx, 30, 24, 4, 16, P.amber);
    rect(ctx, 31, 26, 2, 12, P.white);
    rect(ctx, 24, 30, 4, 4, P.amber);
    rect(ctx, 36, 30, 4, 4, P.amber);
  });
  return CACHE;
}
