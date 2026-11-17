import { rect } from "../rendering/pixel-canvas.js";

export class Particles {
  constructor() {
    this.items = [];
  }
  burst(x, y, color, n = 8, speed = 40) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random());
      this.items.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.25 + Math.random() * 0.4,
        t: 0,
        color,
        size: Math.random() > 0.7 ? 2 : 1,
      });
    }
  }
  trail(x, y, color) {
    this.items.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 0.18,
      t: 0,
      color,
      size: 1,
    });
  }
  update(dt) {
    for (const p of this.items) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
    }
    this.items = this.items.filter((p) => p.t < p.life);
  }
  draw(ctx) {
    for (const p of this.items) {
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = Math.max(0, a);
      rect(ctx, Math.round(p.x), Math.round(p.y), p.size, p.size, p.color);
    }
    ctx.globalAlpha = 1;
  }
  clear() {
    this.items.length = 0;
  }
}
