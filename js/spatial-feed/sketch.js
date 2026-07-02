const CANVAS_SIZE = 1920;

function buildLatitudeFields(p, count) {
  const fields = [];
  const minDist = CANVAS_SIZE / 5;

  const edgePoint = () => {
    const side = Math.floor(p.random(4));
    if (side === 0) return { x: p.random(CANVAS_SIZE), y: 0 };
    if (side === 1) return { x: CANVAS_SIZE, y: p.random(CANVAS_SIZE) };
    if (side === 2) return { x: p.random(CANVAS_SIZE), y: CANVAS_SIZE };
    return { x: 0, y: p.random(CANVAS_SIZE) };
  };

  let attempts = 0;
  while (fields.length < count && attempts < count * 50) {
    attempts++;
    const a = edgePoint();
    const b = edgePoint();
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const tooClose = fields.some(f => {
      const fx = (f.x1 + f.x2) / 2;
      const fy = (f.y1 + f.y2) / 2;
      return Math.hypot(mx - fx, my - fy) < minDist;
    });
    if (!tooClose) fields.push(new LatitudeField(p, a.x, a.y, b.x, b.y));
  }
  return fields;
}

const spatialFeedSketch = (p) => {
  let spatialImages = {};
  let spatialObjects = [];
  let latitudeFields = [];

  p.preload = () => {
    for (const [id, path] of Object.entries(SPATIAL_OBJECT_IMAGE_MAP)) {
      spatialImages[id] = p.loadImage(path);
    }
  };

  p.setup = () => {
    const canvas = p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    canvas.parent('sketch-container');
    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));

    spatialObjects = WEAPONS_CONFIG.weapons.map(
      (weapon) => new SpatialObject(p, weapon, spatialImages[weapon.id], CANVAS_SIZE)
    );

    latitudeFields = buildLatitudeFields(p, 20);
  };

  p.draw = () => {
    p.background(255);
    const t = p.millis();

    for (const field of latitudeFields) {
      field.update();
      field.draw();
    }

    // Distance-based web connecting latitude label midpoints within 400px
    const midpoints = latitudeFields.map(f => ({
      x: (f.x1 + f.x2) / 2,
      y: (f.y1 + f.y2) / 2,
    }));
    p.push();
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.drawingContext.setLineDash([7, 14]);
    for (let i = 0; i < midpoints.length; i++) {
      for (let j = i + 1; j < midpoints.length; j++) {
        if (p.dist(midpoints[i].x, midpoints[i].y, midpoints[j].x, midpoints[j].y) < 711) {
          p.line(midpoints[i].x, midpoints[i].y, midpoints[j].x, midpoints[j].y);
        }
      }
    }
    p.drawingContext.setLineDash([]);
    p.pop();

    for (const obj of spatialObjects) {
      obj.update(t, spatialObjects, CANVAS_SIZE);
    }

    for (const obj of spatialObjects) {
      obj.draw();
    }
  };
};

new p5(spatialFeedSketch);
