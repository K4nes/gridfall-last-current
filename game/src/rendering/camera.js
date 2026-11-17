export class Camera {
  constructor() {
    this.shake = 0;
    this.ox = 0;
    this.oy = 0;
  }
  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 26);
    const s = this.shake;
    this.ox = s > 0.2 ? Math.round((Math.random() - 0.5) * s) : 0;
    this.oy = s > 0.2 ? Math.round((Math.random() - 0.5) * s) : 0;
  }
  begin(ctx) {
    ctx.save();
    ctx.translate(this.ox, this.oy);
  }
  end(ctx) {
    ctx.restore();
  }
}
