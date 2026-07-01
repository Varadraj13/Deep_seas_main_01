class ConnectionManager {
  constructor(p, proximityThreshold = 200, lifespanMs = 4000) {
    this.p = p;
    this.proximityThreshold = proximityThreshold;
    this.lifespanMs = lifespanMs;
    this.connections = new Map();
  }

  static keyFor(a, b) {
    return a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
  }

  update(objects) {
    const now = this.p.millis();

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const a = objects[i];
        const b = objects[j];
        const d = this.p.dist(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
        if (d < this.proximityThreshold) {
          const key = ConnectionManager.keyFor(a, b);
          const existing = this.connections.get(key);
          if (existing) {
            existing.lastSeen = now;
          } else {
            this.connections.set(key, { a, b, createdAt: now, lastSeen: now });
          }
        }
      }
    }

    for (const [key, conn] of this.connections) {
      if (now - conn.lastSeen > this.lifespanMs) this.connections.delete(key);
    }
  }

  draw() {
    const p = this.p;
    const now = p.millis();

    for (const conn of this.connections.values()) {
      const age = now - conn.createdAt;
      const alpha = p.map(age, 0, this.lifespanMs, 160, 0, true);

      p.push();
      p.stroke(200, 30, 30, alpha);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([3, 6]);
      p.line(conn.a.pos.x, conn.a.pos.y, conn.b.pos.x, conn.b.pos.y);
      p.drawingContext.setLineDash([]);
      p.pop();
    }
  }
}
