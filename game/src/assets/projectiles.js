import { P } from "./palette.js";
import { sprite, rect } from "../rendering/pixel-canvas.js";

let CACHE = null;

export function projectileSprites() {
  if (CACHE) return CACHE;
  CACHE = {
    pulse: sprite(6, 6, (ctx) => {
      rect(ctx, 2, 0, 2, 6, P.cyan);
      rect(ctx, 0, 2, 6, 2, P.cyan);
      rect(ctx, 2, 2, 2, 2, P.white);
    }),
    arc: sprite(8, 8, (ctx) => {
      rect(ctx, 3, 0, 2, 3, P.amber);
      rect(ctx, 1, 2, 6, 2, P.amber);
      rect(ctx, 3, 4, 2, 4, P.hazard);
      rect(ctx, 3, 3, 2, 2, P.white);
    }),
    spark: sprite(4, 4, (ctx) => {
      rect(ctx, 1, 0, 2, 4, P.white);
      rect(ctx, 0, 1, 4, 2, P.white);
    }),
  };
  return CACHE;
}
