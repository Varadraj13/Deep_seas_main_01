// Maps each weapon id (from WEAPONS_CONFIG) to its object image file.
const SPATIAL_OBJECT_IMAGE_MAP = {
  D01: 'Images/Wooden_chair.png',
  D02: 'Images/Stool.png',
  D03: 'Images/Broom.png',
  D04: 'Images/Cusion.png',
  D05: 'Images/Table.png',
  D06: 'Images/Box.png',
  R01: 'Images/Bench.png',
  R02: 'Images/Trolley.png',
  R03: 'Images/Wires.png',
  R04: 'Images/Tripod.png',
  R05: 'Images/Fan.png',
  R06: 'Images/Extension_cord.png'
};

class SpatialObject {
  constructor(p, weaponConfig, img, canvasSize) {
    this.p = p;
    this.id = weaponConfig.id;
    this.img = img;
    this.engagementValue = Math.abs(weaponConfig.prob_delta) || 5;

    this.pos = p.createVector(p.random(canvasSize * 0.15, canvasSize * 0.85), p.random(canvasSize * 0.15, canvasSize * 0.85));
    this.vel = p5.Vector.random2D().mult(p.random(0.4, 0.9));
    this.acc = p.createVector(0, 0);

    // Randomized so motion never falls into an obvious repeating cycle.
    this.noiseOffsetX = p.random(1000);
    this.noiseOffsetY = p.random(1000);
    this.noiseScale = p.random(0.0015, 0.003);

    const aspect = img.height / img.width;
    this.size = p.map(this.engagementValue, 0, 25, 60, 130, true);
    this.width = this.size;
    this.height = this.size * aspect;
    this.rotation = p.random(-0.05, 0.05);

    this.minSpeed = 0.3;
    this.maxSpeed = 1.3;
    this.pulseAmount = 0;
  }

  wander(t) {
    const angle = this.p.noise(this.noiseOffsetX + t * this.noiseScale, this.noiseOffsetY) * this.p.TWO_PI * 2;
    const wanderForce = p5.Vector.fromAngle(angle).mult(0.06);
    this.acc.add(wanderForce);
  }

  flock(others) {
    const cohesion = this.p.createVector(0, 0);
    const separation = this.p.createVector(0, 0);
    let count = 0;

    for (const other of others) {
      if (other === this) continue;
      const d = p5.Vector.dist(this.pos, other.pos);
      if (d < 220 && d > 0) {
        cohesion.add(other.pos);
        count++;
        if (d < 90) {
          const away = p5.Vector.sub(this.pos, other.pos).normalize().div(d);
          separation.add(away);
        }
      }
    }

    if (count > 0) {
      cohesion.div(count).sub(this.pos).normalize().mult(0.012);
      this.acc.add(cohesion);
    }
    separation.mult(0.05);
    this.acc.add(separation);
  }

  containWithinBounds(canvasSize) {
    const margin = canvasSize * 0.15;
    const steer = this.p.createVector(0, 0);

    if (this.pos.x < margin) steer.x = this.p.map(this.pos.x, margin, 0, 0, 0.15);
    if (this.pos.x > canvasSize - margin) steer.x = this.p.map(this.pos.x, canvasSize - margin, canvasSize, 0, -0.15);
    if (this.pos.y < margin) steer.y = this.p.map(this.pos.y, margin, 0, 0, 0.15);
    if (this.pos.y > canvasSize - margin) steer.y = this.p.map(this.pos.y, canvasSize - margin, canvasSize, 0, -0.15);

    this.acc.add(steer);
  }

  update(t, others, canvasSize) {
    this.wander(t);
    this.flock(others);
    this.containWithinBounds(canvasSize);

    this.vel.add(this.acc);
    const speed = this.p.constrain(this.vel.mag(), this.minSpeed, this.maxSpeed);
    this.vel.setMag(speed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    if (this.pulseAmount > 0) this.pulseAmount = Math.max(0, this.pulseAmount - 0.02);
  }

  onFieldCross() {
    this.pulseAmount = 1;
    this.vel.rotate(this.p.random(-0.6, 0.6));
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.pos.x, this.pos.y);
    p.rotate(this.rotation + Math.sin(p.frameCount * 0.004 + this.noiseOffsetX) * 0.03);

    if (this.pulseAmount > 0) {
      p.noStroke();
      p.fill(200, 30, 30, this.pulseAmount * 60);
      p.circle(0, 0, this.width * (1.4 + this.pulseAmount * 0.6));
    }

    p.imageMode(p.CENTER);
    p.image(this.img, 0, 0, this.width, this.height);
    p.pop();
  }
}
