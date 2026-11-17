export const CAPACITY = 100;
export const OVERLOAD_SECONDS = 3;
export const SHUTDOWN_SECONDS = 5;
export const RECONNECT_GRACE = 8;

export class PowerGrid {
  constructor() {
    this.capacity = CAPACITY;
    this.overloadTimer = 0;
    this.shutdownTimer = 0;
    this.grace = 0;
    this.trips = 0;
    this.state = "stable";
    this.warned = false;
  }
  draw(towers) {
    if (this.shutdownTimer > 0) return 0;
    let sum = 0;
    for (const t of towers) if (t.active && t.placed) sum += t.drawPower();
    return sum;
  }
  load(towers) {
    return this.capacity === 0 ? 0 : this.draw(towers) / this.capacity;
  }
  update(dt, towers, game) {
    if (this.grace > 0) this.grace = Math.max(0, this.grace - dt);
    if (this.shutdownTimer > 0) {
      this.shutdownTimer -= dt;
      if (this.shutdownTimer <= 0) {
        this.shutdownTimer = 0;
        this.overloadTimer = 0;
        this.grace = RECONNECT_GRACE;
        const over = this.load(towers) > 1;
        game.banner("GRID RECONNECTED", "#5fe3e0", 1.4);
        if (over) {
          game.banner("SELL A TOWER TO RESTORE THE GRID", "#e0a93c", 4.5);
          game.sfx.play("warn");
        } else {
          game.sfx.play("click");
        }
      }
      this.state = "shutdown";
      return;
    }
    const load = this.load(towers);
    if (load > 1) {
      if (this.grace <= 0) this.overloadTimer += dt;
      this.state = "overloaded";
      this.warned = false;
      if (this.grace <= 0 && this.overloadTimer >= OVERLOAD_SECONDS) this.trip(game);
    } else if (load >= 0.7) {
      this.overloadTimer = 0;
      this.state = "critical";
      if (!this.warned) {
        this.warned = true;
        game.sfx.play("warn");
      }
    } else {
      this.overloadTimer = 0;
      this.state = "stable";
      this.warned = false;
    }
  }
  trip(game) {
    this.overloadTimer = 0;
    this.shutdownTimer = SHUTDOWN_SECONDS;
    this.trips += 1;
    game.banner("BREAKER TRIPPED · GRID OFFLINE", "#e0452c", 2.4);
    game.sfx.play("trip");
    game.camera.shake = Math.max(game.camera.shake, 6);
  }
  timerRatio() {
    if (this.state === "overloaded") return Math.min(1, this.overloadTimer / OVERLOAD_SECONDS);
    if (this.shutdownTimer > 0) return Math.min(1, this.shutdownTimer / SHUTDOWN_SECONDS);
    return 0;
  }
}
