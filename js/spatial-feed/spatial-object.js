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

    this.pos = p.createVector(p.random(canvasSize), p.random(canvasSize));
    this.vel = p5.Vector.random2D().mult(p.random(0.4, 0.9));
    this.acc = p.createVector(0, 0);

    // Randomized so motion never falls into an obvious repeating cycle.
    this.noiseOffsetX = p.random(1000);
    this.noiseScale = p.random(0.008, 0.018);
    this.target = p.createVector(p.random(canvasSize), p.random(canvasSize));

    this.targetRadius = 213;

    const aspect = img.height / img.width;
    this.size = p.map(this.engagementValue, 0, 25, 480, 1040, true);
    this.width = this.size;
    this.height = this.size * aspect;
    this.rotation = p.random(-0.05, 0.05);

    this.minSpeed = 0.80;
    this.maxSpeed = 3.47;
    this.pulseAmount = 0;
  }

  wander(t, canvasSize) {
    const toTarget = p5.Vector.sub(this.target, this.pos);
    if (toTarget.mag() < this.targetRadius) {
      this.target = this.p.createVector(
        this.p.random(canvasSize),
        this.p.random(canvasSize)
      );
    }
    const jitter = (this.p.noise(this.noiseOffsetX + t * this.noiseScale) - 0.5) * this.p.PI * 0.6;
    const steerAngle = Math.atan2(toTarget.y, toTarget.x) + jitter;
    this.acc.add(p5.Vector.fromAngle(steerAngle).mult(0.36));
  }

  flock(others) {
    const separation = this.p.createVector(0, 0);

    for (const other of others) {
      if (other === this) continue;
      const d = p5.Vector.dist(this.pos, other.pos);
      if (d < 160 && d > 0) {
        const away = p5.Vector.sub(this.pos, other.pos).normalize().div(d);
        separation.add(away);
      }
    }

    separation.mult(0.05);
    this.acc.add(separation);
  }

  bounceOffWalls(canvasSize) {
    if (this.pos.x < 0)          { this.pos.x = 0;          this.vel.x =  Math.abs(this.vel.x); this.target.x = this.p.random(canvasSize * 0.4, canvasSize); }
    if (this.pos.x > canvasSize) { this.pos.x = canvasSize; this.vel.x = -Math.abs(this.vel.x); this.target.x = this.p.random(0, canvasSize * 0.6); }
    if (this.pos.y < 0)          { this.pos.y = 0;          this.vel.y =  Math.abs(this.vel.y); this.target.y = this.p.random(canvasSize * 0.4, canvasSize); }
    if (this.pos.y > canvasSize) { this.pos.y = canvasSize; this.vel.y = -Math.abs(this.vel.y); this.target.y = this.p.random(0, canvasSize * 0.6); }
  }

  update(t, others, canvasSize) {
    this.wander(t, canvasSize);
    this.flock(others);

    this.vel.add(this.acc);
    const speed = this.p.constrain(this.vel.mag(), this.minSpeed, this.maxSpeed);
    this.vel.setMag(speed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.bounceOffWalls(canvasSize);

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
