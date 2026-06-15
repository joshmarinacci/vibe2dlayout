import {getAllIds} from '@model/document'
import {strokeColor} from '@model/shapes'
import type {AppState} from '@store/types'
import {fillBackground} from '@utils/fillCSS'
import {createPowerUpLogger} from '@logging'

interface ShapeExportData {
    id: string
    x: number
    y: number
    cx: number
    cy: number
    width: number
    height: number
    rotation: number
    isCircle: boolean
    isPhysics: boolean
    isStatic: boolean
    friction: number
}

interface ShapeVisual {
    id: string
    x: number
    y: number
    width: number
    height: number
    rotation: number
    fillCss: string
    strokeCss: string
    strokeWidth: number
    borderRadius: string
}

function buildPhysicsHtml(state: AppState): string {
    const logger = createPowerUpLogger('physics')
    const {document: doc, activePageId} = state

    const pageNode = doc.rootNodes.find(n => n.id === activePageId)
    if (!pageNode) throw new Error('No active page')
    const pageShape = doc.shapes[pageNode.id]
    if (!pageShape || !('transform' in pageShape)) throw new Error('Page shape not found')

    const pageW = pageShape.transform.width
    const pageH = pageShape.transform.height
    const pageX = pageShape.transform.x
    const pageY = pageShape.transform.y

    // Document-level physics settings
    const docPhysics = doc.powerUps.find(p => p.id === 'powerup.physics')
    const s = docPhysics?.settings ?? {}
    const gravityX = typeof s.gravityX === 'number' ? s.gravityX : 0
    const gravityY = typeof s.gravityY === 'number' ? s.gravityY : 9.8
    const iterations = typeof s.iterations === 'number' ? Math.max(1, Math.round(s.iterations)) : 8
    const velIter = Math.max(2, Math.round(iterations / 2))
    const conIter = Math.max(2, Math.round(iterations / 3))

    const allIds = getAllIds(pageNode.children)

    const physicsShapes: ShapeExportData[] = []
    const visuals: ShapeVisual[] = []

    for (const id of allIds) {
        const shape = doc.shapes[id]
        if (!shape || !('transform' in shape)) continue
        if (shape.visible === false) continue

        const t = shape.transform
        const x = t.x - pageX
        const y = t.y - pageY
        const w = t.width
        const h = t.height
        const rotation = t.rotation ?? 0

        // Visual data
        let fillCss = '#cccccc'
        if ('fill' in shape && shape.fill) {
            try { fillCss = fillBackground(shape.fill) } catch { /* skip */ }
        }

        let strokeCss = 'transparent'
        let strokeWidth = 0
        if ('stroke' in shape && shape.stroke) {
            strokeCss = strokeColor(shape.stroke)
            strokeWidth = (shape.stroke as {width?: number}).width ?? 1
        }

        const isCircle = shape.type === 'circle'
        const cornerRadius = ('cornerRadius' in shape && typeof shape.cornerRadius === 'number')
            ? shape.cornerRadius
            : 0
        const borderRadius = isCircle ? '50%' : `${cornerRadius}px`

        visuals.push({id, x, y, width: w, height: h, rotation, fillCss, strokeCss, strokeWidth, borderRadius})

        // Physics body data (only for shapes with physics powerup)
        const physicsEntry = shape.powerUps?.find(p => p.id === 'powerup.physics')
        const physicsBody = physicsEntry?.features['physics-body'] as Record<string, unknown> | undefined
        if (!physicsBody) continue

        const bodyType = typeof physicsBody.bodyType === 'string' ? physicsBody.bodyType : 'dynamic'
        const friction = typeof physicsBody.friction === 'number' ? physicsBody.friction : 0.3
        const isStatic = bodyType !== 'dynamic'

        physicsShapes.push({
            id,
            x, y,
            cx: x + w / 2,
            cy: y + h / 2,
            width: w,
            height: h,
            rotation,
            isCircle,
            isPhysics: true,
            isStatic,
            friction,
        })
    }

    const physicsSet = new Set(physicsShapes.map(s => s.id))

    const shapeDivs = visuals.map(v => {
        const border = v.strokeWidth > 0
            ? `${v.strokeWidth}px solid ${v.strokeCss}`
            : 'none'
        return `    <div id="shape-${v.id}" style="position:absolute;left:0;top:0;width:${v.width}px;height:${v.height}px;background:${v.fillCss};border:${border};border-radius:${v.borderRadius};box-sizing:border-box;transform-origin:center;transform:translate(${v.x}px,${v.y}px) rotate(${v.rotation}deg)${physicsSet.has(v.id) ? '' : ';pointer-events:none'}"></div>`
    }).join('\n')

    const shapeJson = JSON.stringify(physicsShapes, null, 2)

    const wallT = 100
    logger.debug('Building physics HTML export', {
        pageId: activePageId,
        shapeCount: physicsShapes.length,
    })

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Physics Simulation</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1e1e2e;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-height:100vh;font-family:system-ui,sans-serif;padding:24px;gap:16px}
#controls{display:flex;gap:10px}
#controls button{padding:8px 22px;border:none;border-radius:6px;background:#5865f2;color:#fff;font-size:14px;cursor:pointer;transition:background .15s}
#controls button:hover{background:#4752c4}
#container{position:relative;width:${pageW}px;height:${pageH}px;overflow:hidden;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,.5);cursor:grab}
#container:active{cursor:grabbing}
</style>
</head>
<body>
<div id="controls">
  <button id="btn-pause">Pause</button>
  <button id="btn-reset">Reset</button>
</div>
<div id="container">
${shapeDivs}
</div>
<script src="https://unpkg.com/matter-js@0.20.0/build/matter.min.js"></script>
<script>
const {Engine, Bodies, Body, Composite, Mouse, MouseConstraint} = Matter;

const shapeData = ${shapeJson};

const engine = Engine.create({
  positionIterations: ${iterations},
  velocityIterations: ${velIter},
  constraintIterations: ${conIter},
});
engine.gravity.x = ${gravityX};
engine.gravity.y = ${gravityY};
engine.gravity.scale = 0.001;

const bodyMap = {};

for (const s of shapeData) {
  const opts = {friction: s.friction, isStatic: s.isStatic, restitution: 0.3};
  const body = s.isCircle
    ? Bodies.circle(s.cx, s.cy, Math.max(1, Math.min(s.width, s.height) / 2), opts)
    : Bodies.rectangle(s.cx, s.cy, Math.max(1, s.width), Math.max(1, s.height), opts);
  Body.setAngle(body, s.rotation * Math.PI / 180);
  bodyMap[s.id] = body;
  Composite.add(engine.world, body);
}

// Page boundary walls (100px thick, same as app runtime)
const W = ${pageW}, H = ${pageH}, WT = ${wallT};
Composite.add(engine.world, [
  Bodies.rectangle(W/2, -WT/2,           W + WT*2, WT, {isStatic:true}),
  Bodies.rectangle(W/2, H + WT/2,        W + WT*2, WT, {isStatic:true}),
  Bodies.rectangle(-WT/2, H/2,           WT, H + WT*2, {isStatic:true}),
  Bodies.rectangle(W + WT/2, H/2,        WT, H + WT*2, {isStatic:true}),
]);

// Mouse drag
const container = document.getElementById('container');
const mouse = Mouse.create(container);
Composite.add(engine.world, MouseConstraint.create(engine, {
  mouse,
  constraint: {stiffness: 0.2},
}));

let running = true;
let lastTime = 0;

function tick(now) {
  if (running) {
    const dt = Math.min(1000/30, Math.max(1000/120, now - lastTime));
    lastTime = now;
    Engine.update(engine, dt);
    for (const s of shapeData) {
      if (s.isStatic) continue;
      const body = bodyMap[s.id];
      if (!body) continue;
      const x = body.position.x - s.width / 2;
      const y = body.position.y - s.height / 2;
      const r = body.angle * 180 / Math.PI;
      document.getElementById('shape-' + s.id).style.transform =
        'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg)';
    }
  } else {
    lastTime = now;
  }
  requestAnimationFrame(tick);
}

requestAnimationFrame(function(t) { lastTime = t; tick(t); });

document.getElementById('btn-pause').addEventListener('click', function() {
  running = !running;
  this.textContent = running ? 'Pause' : 'Resume';
});

document.getElementById('btn-reset').addEventListener('click', function() {
  for (const s of shapeData) {
    if (s.isStatic) continue;
    const body = bodyMap[s.id];
    if (!body) continue;
    Body.setPosition(body, {x: s.cx, y: s.cy});
    Body.setAngle(body, s.rotation * Math.PI / 180);
    Body.setVelocity(body, {x: 0, y: 0});
    Body.setAngularVelocity(body, 0);
    document.getElementById('shape-' + s.id).style.transform =
      'translate(' + s.x + 'px,' + s.y + 'px) rotate(' + s.rotation + 'deg)';
  }
});
</script>
</body>
</html>`
}

export function exportPhysicsHtml(state: AppState, filename: string): void {
    try {
        const html = buildPhysicsHtml(state)
        const blob = new Blob([html], {type: 'text/html'})
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    } catch (err) {
        alert('Physics HTML export failed: ' + (err instanceof Error ? err.message : String(err)))
    }
}
