export const WAVES = [
  { label: "SCOUT PATROL", threat: "LOW", groups: [{ type: "scout", count: 6, gap: 0.9 }] },
  { label: "MIXED PUSH", threat: "LOW", groups: [{ type: "scout", count: 6, gap: 0.8 }, { type: "heavy", count: 2, gap: 1.6, delay: 1.2 }] },
  { label: "SWARM SURGE", threat: "MEDIUM", groups: [{ type: "swarm", count: 16, gap: 0.22 }, { type: "scout", count: 4, gap: 1.0, delay: 2.0 }] },
  { label: "DISRUPTION", threat: "HIGH", groups: [{ type: "heavy", count: 3, gap: 1.4 }, { type: "emp", count: 3, gap: 1.1, delay: 2.0 }] },
  { label: "SHIELD LINE", threat: "HIGH", groups: [{ type: "shield", count: 2, gap: 2.2 }, { type: "scout", count: 8, gap: 0.5, delay: 1.0 }, { type: "heavy", count: 2, gap: 1.5, delay: 3.0 }] },
  {
    label: "OVERLORD", threat: "BOSS", boss: true,
    groups: [{ type: "overlord", count: 1, gap: 1 }, { type: "scout", count: 10, gap: 0.45, delay: 2.0 }],
  },
];

export class WaveRunner {
  constructor() {
    this.index = -1;
    this.queue = [];
    this.timer = 0;
    this.running = false;
    this.spawned = 0;
  }
  start(index) {
    this.index = index;
    this.queue = [];
    this.spawned = 0;
    const wave = WAVES[index];
    if (!wave) return;
    for (const g of wave.groups) {
      for (let i = 0; i < g.count; i++) {
        this.queue.push({ type: g.type, time: (g.delay || 0) + i * g.gap });
      }
    }
    this.queue.sort((a, b) => a.time - b.time);
    this.timer = 0;
    this.running = true;
  }
  update(dt, game) {
    if (!this.running) return;
    this.timer += dt;
    while (this.queue.length && this.queue[0].time <= this.timer) {
      const next = this.queue.shift();
      this.spawned += 1;
      game.spawnEnemy(next.type);
    }
    if (this.queue.length === 0 && game.enemies.length === 0) {
      this.running = false;
      game.onWaveCleared();
    }
  }
  get total() {
    const wave = WAVES[this.index];
    if (!wave) return 0;
    return wave.groups.reduce((n, g) => n + g.count, 0);
  }
  get remaining() {
    return this.queue.length;
  }
}
