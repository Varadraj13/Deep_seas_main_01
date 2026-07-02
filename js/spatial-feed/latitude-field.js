class LatitudeField {
  constructor(p, x1, y1, x2, y2) {
    this.p = p;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.label = LatitudeField.randomLabel(p);
    this.illumination = 0;
    this.dashOffset = p.random(1000);
  }

  static randomLabel(p) {
    const whole = Math.floor(p.random(1100, 8600));
    const frac = Math.floor(p.random(0, 9999)).toString().padStart(4, '0');
    return `${whole}.${frac}`;
  }

  // Returns true if the segment prevPos->currPos crosses this field's line.
  intersects(prevPos, currPos) {
    const d1 = LatitudeField._cross(this.x1, this.y1, this.x2, this.y2, prevPos.x, prevPos.y);
    const d2 = LatitudeField._cross(this.x1, this.y1, this.x2, this.y2, currPos.x, currPos.y);
    return (d1 > 0 && d2 <= 0) || (d1 < 0 && d2 >= 0);
  }

  static _cross(ax, ay, bx, by, px, py) {
    return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  }

  illuminate() {
    this.illumination = 1;
  }

  update() {
    if (this.illumination > 0) this.illumination = Math.max(0, this.illumination - 0.015);
    this.dashOffset += 0.15;
  }

  draw() {
    const p = this.p;
    p.push();
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.drawingContext.setLineDash([11, 18]);
    p.drawingContext.lineDashOffset = -this.dashOffset;
    p.line(this.x1, this.y1, this.x2, this.y2);
    p.drawingContext.setLineDash([]);
    p.pop();

    const midX = (this.x1 + this.x2) / 2;
    const midY = (this.y1 + this.y2) / 2;
    p.push();
    p.noStroke();
    p.fill(255, 0, 0);
    p.textFont('IBM Plex Mono');
    p.textSize(39);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(this.label, midX + 14, midY - 14);
    p.pop();
  }
}
