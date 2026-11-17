import { TOWERS, TOWER_ORDER } from "../assets/towers.js";
import { towerIcon } from "../assets/icons.js";
import { LEVEL_MULT } from "../systems/combat.js";

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const set = (node, text) => {
  if (node.textContent !== text) node.textContent = text;
};

export class TowerShop {
  constructor(root, game) {
    this.game = game;
    this.root = root;
    this.cards = {};
    this.build();
  }

  build() {
    for (const key of TOWER_ORDER) {
      const def = TOWERS[key];
      const card = el("button", "card");
      card.type = "button";
      card.dataset.key = key;
      const img = el("img");
      img.src = towerIcon(key);
      img.alt = def.short;
      const info = el("div", "info");
      info.append(
        el("div", "name", def.short),
        el("div", "role", def.role),
        el("div", "cost", `${def.cost} CR`),
        el("div", "draw", `${def.draw} W`),
      );
      card.append(img, info, el("div", "key", `${TOWER_ORDER.indexOf(key) + 1}`));
      card.addEventListener("click", () => this.game.selectBuild(key));
      this.root.append(card);
      this.cards[key] = card;
    }
  }

  update(game) {
    const draw = game.drawPower();
    for (const key of TOWER_ORDER) {
      const card = this.cards[key];
      card.classList.toggle("selected", game.selectedBuild === key);
      card.classList.toggle("poor", game.credits < TOWERS[key].cost);
      card.classList.toggle("overdraw", draw + TOWERS[key].draw > 100);
    }
  }
}

export class TowerPanel {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.key = null;
    this.build();
  }

  build() {
    const head = el("div", "head");
    this.title = el("div", "title");
    this.state = el("div", "state", "ONLINE");
    this.close = el("button", "close", "✕");
    this.close.type = "button";
    this.close.title = "Clear selection (right click)";
    this.close.addEventListener("click", () => this.game.clearSelection());
    head.append(this.title, this.state, this.close);

    this.stats = el("div", "stats");

    this.up = el("button", "up");
    this.up.type = "button";
    this.up.addEventListener("click", () => this.game.upgradeSelected());

    this.sell = el("button");
    this.sell.type = "button";
    this.sell.addEventListener("click", () => this.game.sellSelected());

    this.power = el("button");
    this.power.type = "button";
    this.power.addEventListener("click", () => this.game.toggleSelected());

    const row = el("div", "actions");
    row.append(this.sell, this.power);

    this.root.append(head, this.stats, this.up, row);
  }

  update(game) {
    const t = game.selectedTower;
    if (!t || game.state !== "play") {
      this.root.classList.add("hidden");
      return;
    }
    this.root.classList.remove("hidden");
    const def = TOWERS[t.type];
    const cost = t.upgradeCost();
    const nextDraw = t.nextDraw();
    const rate = t.rate(game);
    const offline = game.grid.state === "shutdown";

    const key = `${t.type}${t.level}${t.active}${game.grid.state}${Math.round(rate * 10)}`;
    if (this.key !== key) {
      this.key = key;
      set(this.title, `${def.short} · LV ${t.level}`);
      set(this.state, offline ? "NO GRID" : t.active ? "ONLINE" : "OFFLINE");
      this.state.className = "state" + (offline || !t.active ? " off" : "");
      if (t.type === "tesla") {
        const buff = Math.round(def.buff * LEVEL_MULT[t.level - 1] * 100);
        set(this.stats, `BUFF +${buff}% · RNG ${t.range()} · DRAW ${t.drawPower()} W`);
        set(
          this.up,
          cost === null
            ? "MAX LEVEL"
            : `UPGRADE ${cost} CR · BUFF +${t.nextBuff()}% · ${t.drawPower()}→${nextDraw} W`,
        );
      } else {
        const dps = Math.round(t.damage() * rate);
        set(this.stats, `DMG ${Math.round(t.damage())} · DPS ${dps} · RNG ${t.range()} · DRAW ${t.drawPower()} W`);
        set(
          this.up,
          cost === null
            ? "MAX LEVEL"
            : `UPGRADE ${cost} CR · DPS ${dps}→${Math.round(t.nextDamage() * rate)} · ${t.drawPower()}→${nextDraw} W`,
        );
      }
      set(this.sell, `SELL +${t.refund()}`);
      set(this.power, t.active ? "SHUT DOWN" : "POWER ON");
    }

    this.up.disabled = cost === null || game.credits < cost;
    this.up.classList.toggle("max", cost === null);
  }
}
