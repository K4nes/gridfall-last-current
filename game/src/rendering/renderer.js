import { P } from "../assets/palette.js";
import { PADS, CORE, PATH, buildBackground, AMBIENT } from "../assets/environment.js";
import { towerSprites, TOWERS } from "../assets/towers.js";
import { enemySprites, ENEMIES } from "../assets/enemies.js";
import { coreSprite } from "../assets/structures.js";
import { projectileSprites } from "../assets/projectiles.js";
import { VIEW_W, VIEW_H, rect, pxline, pixelCircle, pixelArc } from "./pixel-canvas.js";
import { drawPixelText, textWidth } from "../assets/font.js";

export class Renderer {
  constructor(ctx, camera) {
    this.ctx = ctx;
    this.camera = camera;
    this.bg = buildBackground();
    this.towers = towerSprites();
    this.enemies = enemySprites();
    this.proj = projectileSprites();
    this.core = coreSprite();
  }

  draw(game) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.camera.begin(ctx);
    ctx.drawImage(this.bg, 0, 0);
    this.drawFlow(game);
    this.drawAmbient(game);

    this.drawPads(game);
    this.drawCore(game);
    this.drawTowers(game);
    this.drawEnemies(game);
    this.drawProjectiles(game);
    game.particles.draw(ctx);
    this.drawEffects(game);
    this.drawFloats(game);
    this.camera.end(ctx);
    this.drawAlarm(game);
    this.drawWaveFlash(game);
    this.drawBanner(game);
  }

  drawFlow(game) {
    const ctx = this.ctx;
    const st = game.grid.state;
    ctx.save();
    ctx.beginPath();
    PATH.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.setLineDash([2, 6]);
    ctx.lineDashOffset = -game.time * 16;
    ctx.strokeStyle = st === "shutdown"
      ? "rgba(224,69,44,0.7)"
      : st === "overloaded"
        ? "rgba(255,177,92,0.8)"
        : "rgba(95,227,224,0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  drawAmbient(game) {
    const ctx = this.ctx;
    for (const f of AMBIENT.fans) {
      pixelCircle(ctx, f.x, f.y, f.r, "#1b242b");
      pixelCircle(ctx, f.x, f.y, f.r - 1, "#141c22");
      for (let i = 0; i < 4; i++) {
        const a = game.time * 2.4 + i * (Math.PI / 2);
        pxline(ctx, f.x, f.y, f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r, "#3a4a56", 1);
      }
      rect(ctx, f.x - 1, f.y - 1, 2, 2, "#5a6a76");
    }
    for (const l of AMBIENT.lamps) {
      const on = Math.sin(game.time * 2.6 + l.phase) > 0.15;
      if (on) {
        ctx.globalAlpha = 0.2;
        rect(ctx, l.x - 3, l.y - 4, 9, 9, P.red);
        ctx.globalAlpha = 1;
      }
      rect(ctx, l.x, l.y - 2, 3, 3, on ? P.red : "#3a1f1c");
    }
    for (const s of AMBIENT.sparks) {
      const cycle = (game.time * 0.22 + s.phase) % 1;
      if (cycle < 0.07) {
        const a = 1 - cycle / 0.07;
        ctx.globalAlpha = 0.35 * a;
        rect(ctx, s.x - 3, s.y - 3, 7, 7, P.cyan);
        ctx.globalAlpha = 1;
        rect(ctx, s.x, s.y, 2, 2, P.white);
        if (cycle < 0.035) {
          pxline(ctx, s.x, s.y, s.x + 3, s.y - 3, P.cyan, 1);
          pxline(ctx, s.x, s.y, s.x - 3, s.y + 2, P.cyan, 1);
        }
      } else {
        rect(ctx, s.x, s.y, 1, 1, "#243039");
      }
    }
    if (Math.random() < 0.05) game.particles.trail(262 + Math.random() * 16, 284, "#2a3742");
  }

  drawAlarm(game) {
    const st = game.grid.state;
    if (st !== "overloaded" && st !== "shutdown") return;
    const ctx = this.ctx;
    const pulse = 0.5 + 0.5 * Math.sin(game.time * 9);
    ctx.globalAlpha = st === "shutdown" ? 0.1 + pulse * 0.05 : 0.04 + pulse * 0.04;
    ctx.fillStyle = P.red;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = 0.45 + pulse * 0.3;
    rect(ctx, 0, 0, VIEW_W, 2, P.red);
    rect(ctx, 0, VIEW_H - 2, VIEW_W, 2, P.red);
    ctx.globalAlpha = 1;
  }

  drawWaveFlash(game) {
    if (!game.waveFlash || game.waveFlash <= 0) return;
    const ctx = this.ctx;
    const a = Math.min(1, game.waveFlash / 0.6);
    ctx.globalAlpha = a * 0.09;
    ctx.fillStyle = P.white;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = 1;
    rect(ctx, 0, Math.round((1 - a) * VIEW_H), VIEW_W, 1, "rgba(95,227,224,0.6)");
  }

  drawPads(game) {
    const ctx = this.ctx;
    for (let i = 0; i < PADS.length; i++) {
      const pad = PADS[i];
      if (game.towers.some((t) => t.pad === pad)) continue;
      const hover = game.hoverPad === i && game.state === "play";
      if (hover && game.selectedBuild) {
        const def = TOWERS[game.selectedBuild];
        ctx.beginPath();
        ctx.arc(pad.x, pad.y, def.range, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(95,227,224,0.07)";
        ctx.fill();
        pixelCircle(ctx, pad.x, pad.y, def.range, "rgba(95,227,224,0.45)", { dash: 6, phase: Math.floor(game.time * 8) });
      }
      if (hover) pixelCircle(ctx, pad.x, pad.y, 11, P.hazard);
    }
  }

  drawCore(game) {
    const ctx = this.ctx;
    const pulse = 0.5 + Math.sin(game.time * 3) * 0.5;
    const dead = game.core <= 0;
    if (!dead) {
      const g = ctx.createRadialGradient(CORE.x, CORE.y, 6, CORE.x, CORE.y, 46);
      g.addColorStop(0, `rgba(95,227,224,${0.1 + pulse * 0.08})`);
      g.addColorStop(1, "rgba(95,227,224,0)");
      ctx.fillStyle = g;
      ctx.fillRect(CORE.x - 48, CORE.y - 48, 96, 96);
    }
    ctx.drawImage(this.core, Math.round(CORE.x - 32), Math.round(CORE.y - 32));

    if (!dead) {
      for (let i = 0; i < 2; i++) {
        const a0 = game.time * (0.9 + i * 0.5) + i * 2.1;
        pixelArc(ctx, CORE.x, CORE.y, 24, a0, a0 + 0.7, "rgba(95,227,224,0.9)");
        pixelArc(ctx, CORE.x, CORE.y, 25, a0, a0 + 0.7, "rgba(95,227,224,0.35)");
      }
      if (game.grid.state !== "stable" && Math.random() < 0.08) {
        const a = Math.random() * Math.PI * 2;
        pxline(ctx, CORE.x, CORE.y, CORE.x + Math.cos(a) * 38, CORE.y + Math.sin(a) * 38, P.white, 1);
      }
    }

    for (let i = 0; i < 10; i++) {
      const a0 = -Math.PI / 2 + (i / 10) * Math.PI * 2 + 0.05;
      const a1 = a0 + (Math.PI * 2) / 10 - 0.1;
      const color = i < game.core ? (dead ? P.red : P.cyan) : "#243039";
      pixelArc(ctx, CORE.x, CORE.y, 28, a0, a1, color);
      pixelArc(ctx, CORE.x, CORE.y, 29, a0, a1, color);
      pixelArc(ctx, CORE.x, CORE.y, 30, a0, a1, color);
    }
    if (game.grid.state === "shutdown") {
      const g = ctx.createRadialGradient(CORE.x, CORE.y, 8, CORE.x, CORE.y, 54);
      g.addColorStop(0, "rgba(224,69,44,0.22)");
      g.addColorStop(1, "rgba(224,69,44,0)");
      ctx.fillStyle = g;
      ctx.fillRect(CORE.x - 56, CORE.y - 56, 112, 112);
      pixelCircle(ctx, CORE.x, CORE.y, 34 + Math.round(Math.sin(game.time * 8) * 2), P.red);
    }
  }

  drawTowers(game) {
    const ctx = this.ctx;
    for (const t of game.towers) {
      const set = this.towers[t.type];
      const selected = game.selectedTower === t;
      const off = !t.active || t.disabled > 0;

      rect(ctx, t.x - 14, t.y + 8, 28, 5, "rgba(0,0,0,0.35)");

      if (selected) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.range(), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(95,227,224,0.05)";
        ctx.fill();
        pixelCircle(ctx, t.x, t.y, t.range(), "rgba(95,227,224,0.5)", { dash: 6, phase: Math.floor(game.time * 8) });
      }

      ctx.globalAlpha = off ? 0.45 : 1;
      ctx.drawImage(set.base, Math.round(t.x - 16), Math.round(t.y - 16));
      if (set.barrels.length) {
        const dir = Math.round(t.aim / (Math.PI / 4));
        const sprite = set.barrels[((dir % 8) + 8) % 8];
        const kick = t.flash > 0 ? 1 : 0;
        ctx.drawImage(sprite, Math.round(t.x - 16 - Math.cos(t.aim) * kick), Math.round(t.y - 16 - Math.sin(t.aim) * kick));
      }
      ctx.globalAlpha = 1;

      if (t.flash > 0) {
        const mx = t.x + Math.cos(t.aim) * 14;
        const my = t.y - 4 + Math.sin(t.aim) * 14;
        rect(ctx, Math.round(mx) - 1, Math.round(my) - 1, 3, 3, P.white);
        ctx.globalAlpha = 0.35;
        pixelCircle(ctx, mx, my, 4, P.white);
        ctx.globalAlpha = 1;
      }

      for (let i = 0; i < t.level - 1; i++) rect(ctx, t.x - 6 + i * 5, t.y + 15, 3, 3, P.hazard);

      let lamp = P.cyan;
      if (game.grid.state === "shutdown") lamp = Math.sin(game.time * 9) > 0 ? P.red : "#3a1f1c";
      else if (game.grid.state === "critical" || game.grid.state === "overloaded") lamp = P.hazard;
      if (!t.active || t.disabled > 0) lamp = P.dim;
      rect(ctx, t.x + 9, t.y - 15, 2, 2, lamp);

      if (t.disabled > 0) {
        pixelCircle(ctx, t.x, t.y, 17, P.purple);
      } else if (!t.active) {
        rect(ctx, t.x - 4, t.y - 20, 8, 2, P.amber);
        pxline(ctx, t.x - 4, t.y - 22, t.x + 4, t.y - 18, P.amber, 1);
      }
    }
  }

  drawEnemies(game) {
    const ctx = this.ctx;
    for (const e of game.enemies) {
      const def = e.def;
      const frames = this.enemies[e.type];
      const frame = frames[Math.floor(e.t * 6) % frames.length];
      const w = def.size;
      if (e.slow > 0) {
        ctx.globalAlpha = 0.35;
        rect(ctx, e.x - w / 2 - 1, e.y - w / 2 - 1, w + 2, w + 2, P.cyanDark);
        ctx.globalAlpha = 1;
      }
      if (e.hit > 0) {
        ctx.globalAlpha = 0.8;
        rect(ctx, e.x - w / 2, e.y - w / 2, w, w, P.white);
        ctx.globalAlpha = 1;
      }
      if (def.empRadius) pixelCircle(ctx, e.x, e.y, w / 2 + 4, "rgba(199,146,234,0.35)");
      if (def.shield) pixelCircle(ctx, e.x, e.y, w / 2 + 4, "rgba(126,231,135,0.3)");
      ctx.drawImage(frame, Math.round(e.x - w / 2), Math.round(e.y - w / 2));

      if (e.shield > 0) pixelCircle(ctx, e.x, e.y, w / 2 + 2, P.green);
      const bw = Math.max(16, w);
      const bx = Math.round(e.x - bw / 2);
      const hy = Math.round(e.y - w / 2) - 7;
      const filled = Math.max(0, Math.ceil(bw * Math.max(0, e.hp / e.maxHp)));
      rect(ctx, bx - 1, hy - 1, bw + 2, 5, "rgba(4,7,10,0.9)");
      rect(ctx, bx, hy, bw, 3, "#161e24");
      if (filled > 0) rect(ctx, bx, hy, filled, 3, e.hp / e.maxHp < 0.35 ? P.red : P.amber);
    }
  }

  drawProjectiles(game) {
    const ctx = this.ctx;
    for (const p of game.combat.projectiles) {
      const s = this.proj[p.sprite];
      ctx.drawImage(s, Math.round(p.x - s.width / 2), Math.round(p.y - s.height / 2));
    }
  }

  drawEffects(game) {
    const ctx = this.ctx;
    for (const b of game.combat.beams) {
      const a = 1 - b.t / b.life;
      ctx.globalAlpha = Math.max(0, a);
      for (let i = 0; i < b.points.length - 1; i++) {
        const p = b.points[i];
        const q = b.points[i + 1];
        const steps = Math.max(2, Math.round(Math.hypot(q.x - p.x, q.y - p.y) / 6));
        let px = p.x;
        let py = p.y;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const x = p.x + (q.x - p.x) * t + (s === steps ? 0 : (Math.random() - 0.5) * 5);
          const y = p.y + (q.y - p.y) * t + (s === steps ? 0 : (Math.random() - 0.5) * 5);
          pxline(ctx, px, py, x, y, P.amber, 1);
          px = x;
          py = y;
        }
      }
      ctx.globalAlpha = 1;
    }
    for (const r of game.combat.rings) {
      const p = r.t / r.life;
      const rad = r.r0 + (r.r1 - r.r0) * p;
      ctx.globalAlpha = Math.max(0, 1 - p);
      pixelCircle(ctx, r.x, r.y, rad, r.color);
      ctx.globalAlpha = 1;
    }
  }

  drawFloats(game) {
    const ctx = this.ctx;
    for (const f of game.floats) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / f.life);
      drawPixelText(ctx, f.text, f.x, f.y - 3, f.color, { align: "center", shadow: "#06090b" });
      ctx.globalAlpha = 1;
    }
  }

  drawBanner(game) {
    const b = game.banners[game.banners.length - 1];
    if (!b) return;
    const ctx = this.ctx;
    const a = Math.min(1, b.t * 6) * Math.min(1, (b.life - b.t) * 3);
    ctx.globalAlpha = Math.max(0, a);
    const w = textWidth(b.text) + 22;
    rect(ctx, 320 - w / 2, 44, w, 16, "rgba(6,9,11,0.85)");
    rect(ctx, 320 - w / 2, 44, 2, 16, b.color);
    drawPixelText(ctx, b.text, 320, 48, b.color, { align: "center" });
    ctx.globalAlpha = 1;
  }
}
