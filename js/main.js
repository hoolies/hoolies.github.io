(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Network canvas — subtle node graph background
     ------------------------------------------------------------------ */
  function initNetworkCanvas() {
    const canvas = document.getElementById("networkCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let nodes = [];
    let animationId = null;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const NODE_COUNT = prefersReducedMotion ? 0 : 55;
    const MAX_DISTANCE = 140;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function createNodes() {
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.5 + 0.5,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;

        if (a.x < 0 || a.x > width) a.vx *= -1;
        if (a.y < 0 || a.y > height) a.vy *= -1;

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 229, 160, 0.35)";
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < MAX_DISTANCE) {
            const alpha = (1 - dist / MAX_DISTANCE) * 0.12;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0, 180, 216, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    createNodes();
    if (!prefersReducedMotion && NODE_COUNT > 0) draw();

    window.addEventListener("resize", () => {
      resize();
      createNodes();
    });
  }

  /* ------------------------------------------------------------------
     Terminal typing effect
     ------------------------------------------------------------------ */
  function initTerminal() {
    const uptimeEl = document.getElementById("terminalUptime");
    const commandEl = document.getElementById("terminalCommand");
    if (!uptimeEl || !commandEl) return;

    const startYear = 1996;
    const years = new Date().getFullYear() - startYear;

    setTimeout(() => {
      uptimeEl.textContent = `${years} years, 0 crashes on fundamentals`;
    }, 800);

    const commands = [
      "cat /proc/skills | grep -E 'linux|mentor|network'",
      "ssh prod 'fix the thing everyone else gave up on'",
      "ansible-playbook train_the_team.yml",
      "tcpdump -i any 'port 443 or port 22'",
    ];

    let cmdIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function typeLoop() {
      const current = commands[cmdIndex];

      if (!deleting) {
        commandEl.textContent = current.slice(0, charIndex + 1);
        charIndex++;

        if (charIndex === current.length) {
          setTimeout(() => { deleting = true; typeLoop(); }, 2200);
          return;
        }
      } else {
        commandEl.textContent = current.slice(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          deleting = false;
          cmdIndex = (cmdIndex + 1) % commands.length;
        }
      }

      setTimeout(typeLoop, deleting ? 35 : 65);
    }

    setTimeout(typeLoop, 1600);
  }

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  function initReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
     Animated counters
     ------------------------------------------------------------------ */
  function animateCounter(el, target, suffix) {
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);
      el.textContent = value + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  function initCounters() {
    const counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || "";
            animateCounter(el, target, suffix);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
     Header scroll state
     ------------------------------------------------------------------ */
  function initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 24);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  function initNav() {
    const toggle = document.getElementById("navToggle");
    const nav = document.getElementById("siteNav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      toggle.setAttribute("aria-label", expanded ? "Open menu" : "Close menu");
      nav.classList.toggle("open", !expanded);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        nav.classList.remove("open");
      });
    });
  }

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  function initFooter() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    initNetworkCanvas();
    initTerminal();
    initReveal();
    initCounters();
    initHeader();
    initNav();
    initFooter();
  });
})();
