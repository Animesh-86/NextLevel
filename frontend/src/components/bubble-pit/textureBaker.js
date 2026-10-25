import Matter from 'matter-js';

// ─── Framer BubblePit Texture Baker ───────────────────────────────────────────
const textureCache = new Map();

export const createGlassyTexture = (url, size) => {
  const key = `${url}__${size}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(url);

      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 1;

      // 1. Clip circle & draw scaled graphic
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      const warpScale = 1.18;
      const wo = (size * (warpScale - 1)) / 2;
      ctx.drawImage(img, -wo, -wo, size * warpScale, size * warpScale);

      // 2. Rim gradient for volumetric depth
      const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.72, cx, cy, r);
      rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
      rimGrad.addColorStop(0.3, 'rgba(0,0,0,0.08)');
      rimGrad.addColorStop(0.62, 'rgba(0,0,0,0.32)');
      rimGrad.addColorStop(0.85, 'rgba(0,0,0,0.62)');
      rimGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // 3. Specular glass stroke border
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r - Math.max(size * 0.015, 1), 0, Math.PI * 2);
      const ringGrad = ctx.createLinearGradient(cx - r * 0.8, cy - r * 0.8, cx + r * 0.55, cy + r * 0.55);
      ringGrad.addColorStop(0, 'rgba(255,255,255,0.85)');
      ringGrad.addColorStop(0.15, 'rgba(225,240,255,0.48)');
      ringGrad.addColorStop(0.35, 'rgba(180,215,255,0.14)');
      ringGrad.addColorStop(0.55, 'rgba(120,170,230,0.04)');
      ringGrad.addColorStop(0.75, 'rgba(160,200,255,0.08)');
      ringGrad.addColorStop(1, 'rgba(210,235,255,0.26)');
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = Math.max(size * 0.018, 1.2);
      ctx.stroke();
      ctx.restore();

      // 4. Primary upper highlight ellipse
      ctx.save();
      const hlX = cx - r * 0.2;
      const hlY = cy - r * 0.35;
      const hlRx = r * 0.45;
      const hlRy = r * 0.24;
      const primaryHL = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlRx);
      primaryHL.addColorStop(0, 'rgba(255,255,255,0.45)');
      primaryHL.addColorStop(0.3, 'rgba(255,255,255,0.22)');
      primaryHL.addColorStop(0.6, 'rgba(255,255,255,0.05)');
      primaryHL.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(hlX, hlY, hlRx, hlRy, -Math.PI * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = primaryHL;
      ctx.fill();
      ctx.restore();

      // 5. Intense pinpoint highlight dot
      ctx.save();
      const dotX = cx - r * 0.33;
      const dotY = cy - r * 0.46;
      const dotR = r * 0.065;
      const dotGrad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, dotR);
      dotGrad.addColorStop(0, 'rgba(255,255,255,1.0)');
      dotGrad.addColorStop(0.35, 'rgba(255,255,255,0.75)');
      dotGrad.addColorStop(0.75, 'rgba(255,255,255,0.15)');
      dotGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = dotGrad;
      ctx.fill();
      ctx.restore();

      // 6. Secondary bottom bounce specular reflection
      ctx.save();
      const secX = cx + r * 0.36;
      const secY = cy + r * 0.42;
      const secGrad = ctx.createRadialGradient(secX, secY, 0, secX, secY, r * 0.2);
      secGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
      secGrad.addColorStop(0.6, 'rgba(255,255,255,0.06)');
      secGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(secX, secY, r * 0.2, r * 0.11, Math.PI * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = secGrad;
      ctx.fill();
      ctx.restore();

      resolve(canvas.toDataURL());
    };

    img.onerror = () => resolve(url);
  });

  textureCache.set(key, p);
  return p;
};

// ─── Add a single physics bubble ──────────────────────────────────────────────
export function addBubble(engine, texture, opts) {
  const bubble = Matter.Bodies.circle(opts.x, opts.y, opts.radius, {
    restitution: opts.restitution || 0.85,
    friction: 0.03,
    frictionAir: 0.005,
    render: {
      sprite: {
        texture,
        xScale: 1,
        yScale: 1
      }
    }
  });

  Matter.Body.setVelocity(bubble, {
    x: (Math.random() - 0.5) * 12,
    y: opts.velocityY || 0
  });

  Matter.Composite.add(engine.world, bubble);
}
