/* ==========================================================================
   PETANQUE MANAGER — 3D Underwater Background
   Floating metallic petanque balls + teal/gold bokeh particles
   Pure vanilla Canvas 2D with 3D projection — no dependencies
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, dpr;
  let mouse = { x: 0.5, y: 0.5 };
  let time = 0;
  let animId;

  // ---- Responsive resize ----
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();

  // ---- Mouse tracking (subtle parallax) ----
  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX / W;
    mouse.y = e.clientY / H;
  }, { passive: true });

  // ---- Config ----
  const BALL_COUNT = 7;
  const PARTICLE_COUNT = 40;
  const BOKEH_COUNT = 12;

  // Reduce on mobile
  const isMobile = W < 768;
  const ballCount = isMobile ? 4 : BALL_COUNT;
  const particleCount = isMobile ? 20 : PARTICLE_COUNT;
  const bokehCount = isMobile ? 6 : BOKEH_COUNT;

  // ---- 3D projection helpers ----
  const FOV = 600;

  function project(x, y, z) {
    const scale = FOV / (FOV + z);
    return {
      x: W / 2 + (x - W / 2) * scale,
      y: H / 2 + (y - H / 2) * scale,
      scale: scale
    };
  }

  // ---- Petanque Ball class (3D sphere) ----
  function Ball(i) {
    this.reset(i, true);
  }

  Ball.prototype.reset = function (i, init) {
    this.x = Math.random() * W;
    this.y = init ? Math.random() * H : -80;
    this.z = 100 + Math.random() * 500;
    this.baseRadius = 25 + Math.random() * 30;
    this.speedX = (Math.random() - 0.5) * 0.15;
    this.speedY = 0.08 + Math.random() * 0.15;
    this.speedZ = (Math.random() - 0.5) * 0.3;
    this.rotAngle = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.003;
    this.phase = Math.random() * Math.PI * 2;
    // Color type: 0 = teal metallic, 1 = steel/silver, 2 = gold accent
    this.type = Math.random() < 0.15 ? 2 : (Math.random() < 0.5 ? 0 : 1);
    this.opacity = 0.18 + Math.random() * 0.16;
  };

  Ball.prototype.update = function (dt) {
    // Gentle floating motion
    this.x += this.speedX + Math.sin(time * 0.0004 + this.phase) * 0.12;
    this.y += this.speedY;
    this.z += this.speedZ + Math.cos(time * 0.0003 + this.phase) * 0.15;

    // Subtle parallax from mouse
    this.x += (mouse.x - 0.5) * 0.08 * (600 / (this.z + 300));
    this.y += (mouse.y - 0.5) * 0.04 * (600 / (this.z + 300));

    this.rotAngle += this.rotSpeed;

    // Bounds
    if (this.z < 50) this.z = 50;
    if (this.z > 700) this.z = 700;
    if (this.x < -100) this.x = W + 100;
    if (this.x > W + 100) this.x = -100;
    if (this.y > H + 100) this.reset(0, false);
  };

  Ball.prototype.draw = function () {
    const p = project(this.x, this.y, this.z);
    const r = this.baseRadius * p.scale;
    if (r < 3) return;

    ctx.save();
    ctx.globalAlpha = this.opacity * p.scale;

    // Main sphere gradient
    const grad = ctx.createRadialGradient(
      p.x - r * 0.3, p.y - r * 0.3, r * 0.05,
      p.x, p.y, r
    );

    if (this.type === 0) {
      // Teal metallic
      grad.addColorStop(0, 'rgba(80, 220, 200, 0.35)');
      grad.addColorStop(0.4, 'rgba(35, 140, 130, 0.25)');
      grad.addColorStop(0.7, 'rgba(18, 80, 75, 0.18)');
      grad.addColorStop(1, 'rgba(10, 40, 50, 0.05)');
    } else if (this.type === 1) {
      // Steel / silver
      grad.addColorStop(0, 'rgba(180, 200, 210, 0.3)');
      grad.addColorStop(0.4, 'rgba(100, 130, 150, 0.2)');
      grad.addColorStop(0.7, 'rgba(50, 75, 90, 0.15)');
      grad.addColorStop(1, 'rgba(20, 40, 55, 0.05)');
    } else {
      // Gold accent
      grad.addColorStop(0, 'rgba(230, 200, 120, 0.3)');
      grad.addColorStop(0.4, 'rgba(180, 150, 60, 0.2)');
      grad.addColorStop(0.7, 'rgba(120, 95, 30, 0.15)');
      grad.addColorStop(1, 'rgba(60, 45, 15, 0.05)');
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle metallic line grooves (petanque ball pattern)
    ctx.globalAlpha = this.opacity * p.scale * 0.3;
    ctx.strokeStyle = this.type === 2
      ? 'rgba(212, 168, 67, 0.2)'
      : 'rgba(45, 212, 191, 0.15)';
    ctx.lineWidth = 0.8 * p.scale;

    // Draw 2 groove lines
    for (let g = 0; g < 2; g++) {
      const angle = this.rotAngle + g * Math.PI * 0.5;
      const offsetX = Math.cos(angle) * r * 0.6;
      const offsetY = Math.sin(angle) * r * 0.15;
      ctx.beginPath();
      ctx.ellipse(
        p.x + offsetX * 0.1, p.y,
        r * 0.85, r * (0.3 + Math.abs(Math.sin(angle)) * 0.5),
        angle * 0.3, 0, Math.PI * 2
      );
      ctx.stroke();
    }

    // Specular highlight
    ctx.globalAlpha = this.opacity * p.scale * 0.6;
    const hlGrad = ctx.createRadialGradient(
      p.x - r * 0.35, p.y - r * 0.35, 0,
      p.x - r * 0.35, p.y - r * 0.35, r * 0.5
    );
    hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = hlGrad;
    ctx.fill();

    ctx.restore();
  };

  // ---- Floating Particle class ----
  function Particle(init) {
    this.reset(init);
  }

  Particle.prototype.reset = function (init) {
    this.x = Math.random() * W;
    this.y = init ? Math.random() * H : H + 20;
    this.z = 50 + Math.random() * 600;
    this.radius = 1 + Math.random() * 2.5;
    this.speedY = -(0.15 + Math.random() * 0.35); // float upward
    this.speedX = (Math.random() - 0.5) * 0.2;
    this.phase = Math.random() * Math.PI * 2;
    this.isTeal = Math.random() > 0.2;
    this.opacity = 0.15 + Math.random() * 0.3;
    this.pulse = 0.5 + Math.random() * 0.5;
  };

  Particle.prototype.update = function () {
    this.x += this.speedX + Math.sin(time * 0.001 + this.phase) * 0.15;
    this.y += this.speedY;
    this.x += (mouse.x - 0.5) * 0.05 * (400 / (this.z + 200));
    this.y += (mouse.y - 0.5) * 0.03 * (400 / (this.z + 200));

    if (this.y < -30 || this.x < -30 || this.x > W + 30) {
      this.reset(false);
    }
  };

  Particle.prototype.draw = function () {
    const p = project(this.x, this.y, this.z);
    const r = this.radius * p.scale;
    if (r < 0.3) return;

    const pulseAlpha = this.opacity * (0.7 + Math.sin(time * 0.002 * this.pulse + this.phase) * 0.3);

    ctx.save();
    ctx.globalAlpha = pulseAlpha * p.scale;

    // Glow
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
    if (this.isTeal) {
      grad.addColorStop(0, 'rgba(45, 212, 191, 0.6)');
      grad.addColorStop(0.4, 'rgba(45, 212, 191, 0.15)');
      grad.addColorStop(1, 'rgba(45, 212, 191, 0)');
    } else {
      grad.addColorStop(0, 'rgba(212, 168, 67, 0.5)');
      grad.addColorStop(0.4, 'rgba(212, 168, 67, 0.12)');
      grad.addColorStop(1, 'rgba(212, 168, 67, 0)');
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Core dot
    ctx.globalAlpha = pulseAlpha * p.scale * 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = this.isTeal ? 'rgba(120, 240, 220, 0.8)' : 'rgba(240, 210, 130, 0.7)';
    ctx.fill();

    ctx.restore();
  };

  // ---- Soft Bokeh orb class (large, very transparent) ----
  function Bokeh(init) {
    this.reset(init);
  }

  Bokeh.prototype.reset = function (init) {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.z = 200 + Math.random() * 400;
    this.radius = 60 + Math.random() * 120;
    this.speedX = (Math.random() - 0.5) * 0.08;
    this.speedY = (Math.random() - 0.5) * 0.06;
    this.phase = Math.random() * Math.PI * 2;
    this.isTeal = Math.random() > 0.3;
    this.opacity = 0.02 + Math.random() * 0.035;
  };

  Bokeh.prototype.update = function () {
    this.x += this.speedX + Math.sin(time * 0.0002 + this.phase) * 0.08;
    this.y += this.speedY + Math.cos(time * 0.00025 + this.phase) * 0.06;
    this.x += (mouse.x - 0.5) * 0.15 * (300 / (this.z + 200));
    this.y += (mouse.y - 0.5) * 0.1 * (300 / (this.z + 200));

    // Soft wrap
    if (this.x < -this.radius * 2) this.x = W + this.radius;
    if (this.x > W + this.radius * 2) this.x = -this.radius;
    if (this.y < -this.radius * 2) this.y = H + this.radius;
    if (this.y > H + this.radius * 2) this.y = -this.radius;
  };

  Bokeh.prototype.draw = function () {
    const p = project(this.x, this.y, this.z);
    const r = this.radius * p.scale;
    if (r < 5) return;

    const pulseAlpha = this.opacity * (0.8 + Math.sin(time * 0.0008 + this.phase) * 0.2);

    ctx.save();
    ctx.globalAlpha = pulseAlpha;

    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    if (this.isTeal) {
      grad.addColorStop(0, 'rgba(45, 212, 191, 0.12)');
      grad.addColorStop(0.5, 'rgba(30, 150, 140, 0.05)');
      grad.addColorStop(1, 'rgba(20, 80, 75, 0)');
    } else {
      grad.addColorStop(0, 'rgba(212, 168, 67, 0.08)');
      grad.addColorStop(0.5, 'rgba(180, 140, 50, 0.03)');
      grad.addColorStop(1, 'rgba(120, 90, 30, 0)');
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  };

  // ---- Create objects ----
  const balls = [];
  const particles = [];
  const bokehs = [];

  for (let i = 0; i < ballCount; i++) balls.push(new Ball(i));
  for (let i = 0; i < particleCount; i++) particles.push(new Particle(true));
  for (let i = 0; i < bokehCount; i++) bokehs.push(new Bokeh(true));

  // ---- Sort by Z for proper depth rendering ----
  function sortByZ(arr) {
    arr.sort(function (a, b) { return b.z - a.z; });
  }

  // ---- Animation loop ----
  let lastTime = 0;

  function animate(now) {
    const dt = now - lastTime;
    lastTime = now;
    time = now;

    // Draw base background gradient (replaces CSS body::before)
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0b2027');
    bgGrad.addColorStop(0.3, '#0d2c35');
    bgGrad.addColorStop(0.6, '#0f3640');
    bgGrad.addColorStop(1, '#0b2027');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle radial color zones
    ctx.globalAlpha = 1;
    var z1 = ctx.createRadialGradient(W * 0.15, H * 0.2, 0, W * 0.15, H * 0.2, 500);
    z1.addColorStop(0, 'rgba(20, 80, 100, 0.5)');
    z1.addColorStop(1, 'transparent');
    ctx.fillStyle = z1;
    ctx.fillRect(0, 0, W, H);

    var z2 = ctx.createRadialGradient(W * 0.85, H * 0.3, 0, W * 0.85, H * 0.3, 400);
    z2.addColorStop(0, 'rgba(15, 70, 90, 0.4)');
    z2.addColorStop(1, 'transparent');
    ctx.fillStyle = z2;
    ctx.fillRect(0, 0, W, H);

    var z3 = ctx.createRadialGradient(W * 0.5, H * 0.7, 0, W * 0.5, H * 0.7, 350);
    z3.addColorStop(0, 'rgba(25, 90, 110, 0.3)');
    z3.addColorStop(1, 'transparent');
    ctx.fillStyle = z3;
    ctx.fillRect(0, 0, W, H);

    // Update all
    bokehs.forEach(function (b) { b.update(); });
    balls.forEach(function (b) { b.update(dt); });
    particles.forEach(function (p) { p.update(); });

    // Sort for depth
    sortByZ(bokehs);
    sortByZ(balls);
    sortByZ(particles);

    // Draw back to front: bokehs → balls → particles
    bokehs.forEach(function (b) { b.draw(); });
    balls.forEach(function (b) { b.draw(); });
    particles.forEach(function (p) { p.draw(); });

    animId = requestAnimationFrame(animate);
  }

  // ---- Start ----
  animId = requestAnimationFrame(animate);

  // ---- Pause when tab hidden (perf) ----
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      lastTime = performance.now();
      animId = requestAnimationFrame(animate);
    }
  });

})();
