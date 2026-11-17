import { TOWERS, TOWER_ORDER } from "../assets/towers.js";
import { ENEMIES } from "../assets/enemies.js";
import { P } from "../assets/palette.js";

export const LEVEL_MULT = [1, 1.35, 1.7];
export const LEVEL_DRAW = [1, 1.3, 1.7];

export class Tower {
  constructor(type, pad) {
    this.type = type;
    this.x = pad.x;
    this.y = pad.y;
    this.pad = pad;
    this.level = 1;
    this.active = true;
    this.disabled = 0;
    this.cd = 0;
    this.aim = -Math.PI / 2;
    this.flash = 0;
    this.placed = true;
  }
  base() {
    return TOWERS[this.type];
  }
  damage() {
    return this.base().damage * LEVEL_MULT[this.level - 1];
  }
  range() {
    return this.base().range;
  }
  drawPower() {
    return Math.round(this.base().draw * LEVEL_DRAW[this.level - 1]);
  }
  nextDraw() {
    if (this.level >= 3) return null;
    return Math.round(this.base().draw * LEVEL_DRAW[this.level]);
  }
  nextDamage() {
    if (this.level >= 3) return null;
    return this.base().damage * LEVEL_MULT[this.level];
  }
  nextBuff() {
    if (this.level >= 3 || this.type !== "tesla") return null;
    return Math.round(this.base().buff * LEVEL_MULT[this.level] * 100);
  }
  rate(game) {
    const base = this.base().rate;
    if (base <= 0) return 0;
    let mult = 1;
    for (const t of game.towers) {
      if (t !== this && t.type === "tesla" && t.active && t.disabled <= 0) {
        if (Math.hypot(t.x - this.x, t.y - this.y) <= t.range()) mult += t.base().buff * LEVEL_MULT[t.level - 1];
      }
    }
    return base * mult;
  }
  upgradeCost() {
    if (this.level >= 3) return null;
    return this.base().upgradeCost[this.level - 1];
  }
  refund() {
    const spent = this.base().cost + this.base().upgradeCost.slice(0, this.level - 1).reduce((a, b) => a + b, 0);
    return Math.round(spent * 0.6);
  }
  update(dt, game) {
    this.flash = Math.max(0, this.flash - dt);
    if (this.disabled > 0) {
      this.disabled -= dt;
      return;
    }
    if (!this.active) return;
    const rate = this.rate(game);
    if (rate <= 0) return;
    const target = this.pick(game);
    if (target) this.aim = Math.atan2(target.y - this.y, target.x - this.x);
    this.cd -= dt;
    if (this.cd > 0 || !target) return;
    this.cd = 1 / rate;
    this.flash = 0.12;
    game.combat.fire(this, target, game);
  }
  pick(game) {
    let best = null;
    for (const e of game.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - this.x, e.y - this.y) > this.range()) continue;
      if (!best || e.progress > best.progress) best = e;
    }
    return best;
  }
}

export class Enemy {
  constructor(type, scale = 1) {
    this.type = type;
    this.def = ENEMIES[type];
    this.maxHp = this.def.hp * scale;
    this.hp = this.maxHp;
    this.progress = 0;
    this.x = 0;
    this.y = 0;
    this.slow = 0;
    this.shield = type === "shield" ? 70 : 0;
    this.dead = false;
    this.hit = 0;
    this.empCd = 0.6;
    this.auraCd = 0.8;
    this.spawnCd = 6;
    this.t = Math.random() * 2;
  }
  get speed() {
    return this.def.speed * (this.slow > 0 ? 0.6 : 1);
  }
  applySlow(seconds) {
    this.slow = Math.max(this.slow, seconds);
  }
  update(dt, path, game) {
    this.t += dt;
    if (this.slow > 0) this.slow -= dt;
    this.hit = Math.max(0, this.hit - dt);
    this.progress += this.speed * dt;
    if (this.progress >= path.total) {
      this.dead = true;
      game.coreHit(this);
      return;
    }
    const p = path.at(this.progress);
    this.x = p.x;
    this.y = p.y;

    if (this.type === "emp") {
      this.empCd -= dt;
      if (this.empCd <= 0) {
        this.empCd = 1;
        let best = null;
        for (const t of game.towers) {
          const d = Math.hypot(t.x - this.x, t.y - this.y);
          if (d <= this.def.empRadius && (!best || d < best.d)) best = { t, d };
        }
        if (best && best.t.disabled <= 0) {
          best.t.disabled = this.def.empTime;
          game.particles.burst(best.t.x, best.t.y, P.purple, 8, 30);
          game.float(best.t.x, best.t.y - 18, "EMP", P.purple);
          game.sfx.play("warn");
        }
      }
    }
    if (this.type === "shield") {
      this.auraCd -= dt;
      if (this.auraCd <= 0) {
        this.auraCd = 0.8;
        for (const e of game.enemies) {
          if (e.dead || e === this) continue;
          if (Math.hypot(e.x - this.x, e.y - this.y) <= this.def.aura) {
            e.shield = Math.min(40, e.shield + 10);
          }
        }
      }
    }
    if (this.type === "overlord") {
      this.spawnCd -= dt;
      if (this.spawnCd <= 0) {
        this.spawnCd = 7;
        game.spawnEnemy("scout", Math.max(0, this.progress - 20));
        game.banner("OVERLORD DEPLOYING DRONES", P.red, 2.2);
      }
    }
  }
  damage(amount, game) {
    let dealt = amount;
    if (this.def.armor) dealt *= 1 - this.def.armor;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, dealt);
      this.shield -= absorbed;
      dealt -= absorbed;
      game.particles.burst(this.x, this.y, P.green, 2, 20);
    }
    if (dealt <= 0) return;
    this.hp -= dealt;
    this.hit = 0.08;
    if (dealt >= 6 && Math.random() < 0.55) {
      game.float(this.x + (Math.random() * 10 - 5), this.y - 10, `-${Math.round(dealt)}`, "#e8f1f2");
    }
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      game.onKill(this);
    }
  }
}

export class Combat {
  constructor() {
    this.projectiles = [];
    this.beams = [];
    this.rings = [];
  }
  impact(x, y, color) {
    this.rings.push({ x, y, r0: 2, r1: 15, color, t: 0, life: 0.3 });
  }
  fire(tower, target, game) {
    const t = tower.type;
    if (t === "pulse") {
      const mx = tower.x + Math.cos(tower.aim) * 8;
      const my = tower.y - 4 + Math.sin(tower.aim) * 8;
      this.projectiles.push({
        x: mx, y: my, target, damage: tower.damage(),
        speed: 190, color: P.cyan, sprite: "pulse",
      });
      game.sfx.play("pulse");
      game.particles.burst(mx, my, P.cyan, 2, 20);
    } else if (t === "arc") {
      const hit = [];
      let current = target;
      const count = tower.base().chainCount || 3;
      const reach = tower.base().chain || 48;
      for (let i = 0; i < count && current; i++) {
        hit.push(current);
        let next = null;
        for (const e of game.enemies) {
          if (e.dead || hit.includes(e)) continue;
          if (Math.hypot(e.x - current.x, e.y - current.y) <= reach) {
            if (!next || e.progress > next.progress) next = e;
          }
        }
        current = next;
      }
      const points = [{ x: tower.x, y: tower.y - 4 }];
      for (const e of hit) points.push({ x: e.x, y: e.y });
      this.beams.push({ points, color: P.amber, t: 0, life: 0.16 });
      for (const e of hit) e.damage(tower.damage() * (e.slow > 0 ? 1.3 : 1), game);
      game.sfx.play("arc");
    } else if (t === "cryo") {
      this.rings.push({ x: tower.x, y: tower.y, r0: 6, r1: tower.range(), color: "#8fd3ff", t: 0, life: 0.35 });
      for (const e of game.enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - tower.x, e.y - tower.y) <= tower.range()) {
          e.damage(tower.damage(), game);
          e.applySlow(tower.base().slow || 2.5);
        }
      }
      game.sfx.play("cryo");
    }
  }
  update(dt, game) {
    for (const p of this.projectiles) {
      const target = p.target;
      let tx;
      let ty;
      if (target && !target.dead) {
        tx = target.x;
        ty = target.y;
      } else {
        tx = p.lastX ?? p.x;
        ty = p.lastY ?? p.y;
      }
      p.lastX = tx;
      p.lastY = ty;
      const d = Math.hypot(tx - p.x, ty - p.y);
      if (d < 4) {
        if (target && !target.dead) {
          target.damage(p.damage, game);
          game.particles.burst(target.x, target.y, p.color, 4, 30);
          this.impact(target.x, target.y, p.color);
        }
        p.dead = true;
        continue;
      }
      const step = Math.min(d, p.speed * dt);
      p.x += ((tx - p.x) / d) * step;
      p.y += ((ty - p.y) / d) * step;
      if (Math.random() < 0.6) game.particles.trail(p.x, p.y, P.cyanDark);
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    for (const list of [this.beams, this.rings]) {
      for (const it of list) it.t += dt;
      while (list.length && list[0].t > list[0].life) list.shift();
    }
  }
  reset() {
    this.projectiles = [];
    this.beams = [];
    this.rings = [];
  }
  chainBonusText() {
    return "";
  }
}
