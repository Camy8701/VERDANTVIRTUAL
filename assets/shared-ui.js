(function () {
  function initCardFlashlight(root) {
    const scope = root || document;
    scope.querySelectorAll('.card-flashlight').forEach((card) => {
      if (card.dataset.vvFlashInit === '1') return;
      card.dataset.vvFlashInit = '1';
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', (event.clientX - rect.left) + 'px');
        card.style.setProperty('--mouse-y', (event.clientY - rect.top) + 'px');
      });
    });
  }

  function initSubHeadlineObserver(root) {
    const scope = root || document;
    const targets = Array.from(scope.querySelectorAll('.sub-hl')).filter((el) => !el.classList.contains('is-visible'));
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    targets.forEach((el) => observer.observe(el));
  }

  function initFooterBloom(root) {
    const scope = root || document;
    const canvas = scope.getElementById('footer-botanical');
    if (!canvas || canvas.dataset.vvBloomInit === '1') return;
    canvas.dataset.vvBloomInit = '1';

    const host = canvas.parentElement;
    if (!host) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const petalColors = [
      { h: 155, s: 55, l: 40 },
      { h: 140, s: 40, l: 52 },
      { h: 85, s: 30, l: 58 },
      { h: 45, s: 35, l: 62 },
      { h: 160, s: 45, l: 35 }
    ];
    const stemColors = [
      { h: 155, s: 45, l: 22 },
      { h: 140, s: 35, l: 28 },
      { h: 120, s: 28, l: 32 }
    ];

    let w = 0;
    let h = 0;
    let rafId = 0;
    let mode = 'idle';
    let inView = false;
    let stems = [];
    let flowers = [];
    let staticLayer = null;

    function resizeCanvas() {
      const rect = host.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
    }

    class Stem {
      constructor(x) {
        this.x = x;
        this.curr = 0;
        this.color = stemColors[Math.floor(Math.random() * stemColors.length)];
        this.done = false;
        this.flowerType = Math.floor(Math.random() * 4);
        this.segs = [];
        const len = h * (0.25 + (Math.random() * 0.45));
        let cx = x;
        let cy = h + 5;
        let ca = (-Math.PI / 2) + ((Math.random() - 0.5) * 0.35);
        for (let i = 0; i < len / 5; i += 1) {
          ca += (Math.random() - 0.5) * 0.12;
          cx += Math.cos(ca) * 5;
          cy += Math.sin(ca) * 5;
          this.segs.push({ x: cx, y: cy });
        }
      }

      drawGrow() {
        if (this.curr < this.segs.length - 1) {
          const idx = Math.floor(this.curr);
          const a = this.segs[idx];
          const b = this.segs[idx + 1];
          if (!a || !b) return;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `hsla(${this.color.h},${this.color.s}%,${this.color.l}%,0.25)`;
          ctx.lineWidth = (2 * (1 - (this.curr / this.segs.length))) + 0.8;
          ctx.stroke();
          this.curr += 1.4;
          return;
        }

        if (!this.done) {
          this.done = true;
          flowers.push(new Flower(this.segs[this.segs.length - 1], this.flowerType));
        }
      }
    }

    class Flower {
      constructor(pos, type) {
        this.x = pos.x;
        this.y = pos.y;
        this.type = type;
        this.age = 0;
        this.max = 90 + (Math.random() * 50);
        this.clr = petalColors[Math.floor(Math.random() * petalColors.length)];
        const count = type === 0 ? 12 : 6;
        this.petals = Array.from({ length: count }, (_, i) => ({
          a: (i / count) * Math.PI * 2,
          s: 0.8 + (Math.random() * 0.5)
        }));
      }

      drawGrow() {
        if (this.age >= this.max) return;
        this.age += 1;
        const grow = Math.min(1, this.age / 65);
        this.petals.forEach((p) => {
          if (Math.random() > 0.55) return;
          const r = (this.type === 0 ? 14 : 22) * grow;
          ctx.beginPath();
          ctx.ellipse(
            this.x + (Math.cos(p.a) * r * 0.5),
            this.y + (Math.sin(p.a) * r * 0.5),
            r * p.s,
            r * 0.55,
            p.a,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `hsla(${this.clr.h},${this.clr.s}%,${this.clr.l}%,0.07)`;
          ctx.fill();
        });
        if (this.age > 35 && Math.random() > 0.82) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, 2.5 * grow, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(212,168,83,0.2)';
          ctx.fill();
        }
      }
    }

    function captureStaticLayer() {
      staticLayer = document.createElement('canvas');
      staticLayer.width = canvas.width;
      staticLayer.height = canvas.height;
      const sctx = staticLayer.getContext('2d');
      if (!sctx) return;
      sctx.drawImage(canvas, 0, 0);
    }

    function drawBreathingGlow(timestamp) {
      const t = timestamp * 0.001;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      flowers.forEach((flower, idx) => {
        const pulse = 0.5 + (0.5 * Math.sin((t * 1.15) + (idx * 0.7)));
        const r = (flower.type === 0 ? 18 : 24) * (0.75 + (pulse * 0.42));
        const glow = ctx.createRadialGradient(flower.x, flower.y, 0, flower.x, flower.y, r * 2.6);
        glow.addColorStop(0, `hsla(${flower.clr.h},${flower.clr.s}%,${Math.min(82, flower.clr.l + 18)}%,${0.08 + (pulse * 0.12)})`);
        glow.addColorStop(1, `hsla(${flower.clr.h},${flower.clr.s}%,${Math.min(82, flower.clr.l + 18)}%,0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(flower.x, flower.y, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function renderGrow() {
      if (!inView) {
        rafId = 0;
        return;
      }
      let active = false;
      stems.forEach((stem) => {
        stem.drawGrow();
        if (!stem.done) active = true;
      });
      flowers.forEach((flower) => {
        flower.drawGrow();
        if (flower.age < flower.max) active = true;
      });
      if (active) {
        rafId = requestAnimationFrame(renderGrow);
        return;
      }
      captureStaticLayer();
      mode = 'breathe';
      rafId = requestAnimationFrame(renderBreathe);
    }

    function renderBreathe(timestamp) {
      if (!inView || mode !== 'breathe') {
        rafId = 0;
        return;
      }
      ctx.clearRect(0, 0, w, h);
      if (staticLayer) {
        ctx.drawImage(staticLayer, 0, 0, w, h);
      }
      drawBreathingGlow(timestamp);
      rafId = requestAnimationFrame(renderBreathe);
    }

    function stopLoop() {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function initGrowPhase() {
      mode = 'grow';
      staticLayer = null;
      flowers = [];
      stems = Array.from({ length: Math.floor(w / 35) }, () => new Stem(Math.random() * w));
      ctx.clearRect(0, 0, w, h);
      if (inView) {
        rafId = requestAnimationFrame(renderGrow);
      }
    }

    function startLoop() {
      if (rafId) return;
      if (mode === 'idle') {
        initGrowPhase();
        return;
      }
      if (mode === 'grow') {
        rafId = requestAnimationFrame(renderGrow);
        return;
      }
      if (mode === 'breathe') {
        rafId = requestAnimationFrame(renderBreathe);
      }
    }

    function rebuild() {
      stopLoop();
      resizeCanvas();
      mode = 'idle';
      if (inView) startLoop();
    }

    resizeCanvas();
    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        rebuild();
      }).observe(host);
    } else {
      window.addEventListener('resize', rebuild, { passive: true });
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            inView = true;
            startLoop();
          } else {
            inView = false;
            stopLoop();
          }
        });
      }, { threshold: 0.2 });
      observer.observe(host);
    } else {
      inView = true;
      startLoop();
    }
  }

  function initScrambleText(root) {
    const scope = root || document;
    const targets = Array.from(scope.querySelectorAll('[data-vv-scramble]'));
    if (!targets.length) return;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    function scramble(el) {
      if (el.dataset.vvScrambleDone === '1') return;
      el.dataset.vvScrambleDone = '1';
      const finalText = el.dataset.scrambleText || el.textContent.trim();
      const totalFrames = 20;
      let frame = 0;

      const tick = () => {
        frame += 1;
        const revealCount = Math.floor((frame / totalFrames) * finalText.length);
        let out = '';
        for (let i = 0; i < finalText.length; i += 1) {
          const ch = finalText[i];
          if (ch === ' ') {
            out += ' ';
            continue;
          }
          if (i < revealCount || /[^A-Za-z0-9]/.test(ch)) {
            out += ch;
          } else {
            out += alphabet[Math.floor(Math.random() * alphabet.length)];
          }
        }
        el.textContent = out;
        if (frame < totalFrames) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = finalText;
        }
      };

      tick();
    }

    if (!('IntersectionObserver' in window)) {
      targets.forEach(scramble);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        scramble(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });

    targets.forEach((el) => observer.observe(el));
  }

  function init(root) {
    initCardFlashlight(root);
    initSubHeadlineObserver(root);
    initFooterBloom(root);
    initScrambleText(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function onReady() {
      document.removeEventListener('DOMContentLoaded', onReady);
      init(document);
    });
  } else {
    init(document);
  }

  window.VVSharedUI = {
    init,
    initCardFlashlight,
    initSubHeadlineObserver,
    initFooterBloom,
    initScrambleText
  };
})();
