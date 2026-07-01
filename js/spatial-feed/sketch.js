const CANVAS_SIZE = 1080;

function buildLatitudeFields(p, count) {
  const fields = [];
  const edgePoint = () => {
    const side = Math.floor(p.random(4));
    if (side === 0) return { x: p.random(CANVAS_SIZE), y: 0 };
    if (side === 1) return { x: CANVAS_SIZE, y: p.random(CANVAS_SIZE) };
    if (side === 2) return { x: p.random(CANVAS_SIZE), y: CANVAS_SIZE };
    return { x: 0, y: p.random(CANVAS_SIZE) };
  };

  for (let i = 0; i < count; i++) {
    const a = edgePoint();
    const b = edgePoint();
    fields.push(new LatitudeField(p, a.x, a.y, b.x, b.y));
  }
  return fields;
}

const spatialFeedSketch = (p) => {
  let spatialImages = {};
  let spatialObjects = [];
  let latitudeFields = [];
  let connectionManager;

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

    latitudeFields = buildLatitudeFields(p, 7);
    connectionManager = new ConnectionManager(p, 200, 4000);
  };

  p.draw = () => {
    p.background(255);
    const t = p.millis();

    for (const field of latitudeFields) {
      field.update();
      field.draw();
    }

    for (const obj of spatialObjects) {
      const prevPos = obj.pos.copy();
      obj.update(t, spatialObjects, CANVAS_SIZE);

      for (const field of latitudeFields) {
        if (field.intersects(prevPos, obj.pos)) {
          obj.onFieldCross();
          field.illuminate();
        }
      }
    }

    connectionManager.update(spatialObjects);
    connectionManager.draw();

    for (const obj of spatialObjects) {
      obj.draw();
    }
  };
};

new p5(spatialFeedSketch);
