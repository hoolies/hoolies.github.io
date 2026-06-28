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
    const outputEl = document.getElementById("terminalCommandOutput");
    if (!uptimeEl || !commandEl || !outputEl) return;

    setTimeout(() => {
      uptimeEl.textContent = "30 years on Linux, load average: calm under pressure";
    }, 800);

    const commands = [
      {
        cmd: "proxychains4 -q curl ifconfig.me",
        output: "203.0.113.42",
      },
      {
        cmd: "ssh hoolies@prod -t 'tmux attach -t incident'",
        output: "[incident] 3 windows (attached)",
      },
      {
        cmd: "ssh cisco-core01 'show ip bgp summary'",
        output: "BGP router identifier 10.0.0.1 · 42 routes · 0 flaps",
      },
      {
        cmd: "ssh juniper-fw01 'show route table inet.0'",
        output: "inet.0: 128 destinations, 512 routes (128 active)",
      },
      {
        cmd: "nc -zv db.internal 22 443 5432",
        output: "Connection to db.internal 22 port [tcp/ssh] succeeded!",
      },
      {
        cmd: "nmap -sV --top-ports 100 10.20.30.0/24",
        output: "Nmap done: 256 IP addresses · 12 hosts up · 0.84s elapsed",
      },
      {
        cmd: "htop",
        output: "CPU ████░░░░░░ 42% · MEM 6.2G/16G · load 0.42 0.38 0.31",
      },
      {
        cmd: 'sudo vim -q <(grep -rni "error" /var/log/)',
        output: '/var/log/syslog:1842: error: connection reset by peer',
      },
    ];

    let cmdIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function hideOutput() {
      outputEl.hidden = true;
      outputEl.textContent = "";
    }

    function showOutput(text) {
      outputEl.textContent = text;
      outputEl.hidden = false;
    }

    function typeLoop() {
      const current = commands[cmdIndex];

      if (!deleting) {
        commandEl.textContent = current.cmd.slice(0, charIndex + 1);
        charIndex++;

        if (charIndex === current.cmd.length) {
          showOutput(current.output);
          setTimeout(() => { deleting = true; typeLoop(); }, 2200);
          return;
        }
      } else {
        hideOutput();
        commandEl.textContent = current.cmd.slice(0, charIndex - 1);
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
     Contact form — FormSubmit relay (email not exposed in markup)
     ------------------------------------------------------------------ */
  function initContactForm() {
    const form = document.getElementById("contactForm");
    const statusEl = document.getElementById("contactStatus");
    const submitBtn = document.getElementById("contactSubmit");
    if (!form || !statusEl || !submitBtn) return;

    const endpoint = "https://formsubmit.co/ajax/chrysanthos@rouvellas.com";

    if (new URLSearchParams(window.location.search).get("sent") === "1") {
      statusEl.textContent = "Message sent. I'll get back to you soon.";
      statusEl.classList.add("form-status-success");
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
      statusEl.textContent = "";
      statusEl.className = "form-status";

      const payload = new FormData(form);
      payload.append("_subject", "Portfolio contact");
      payload.append("_captcha", "false");

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: payload,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("Request failed");
        }

        form.reset();
        statusEl.textContent = "Message sent. I'll get back to you soon.";
        statusEl.classList.add("form-status-success");
      } catch {
        statusEl.textContent = "Something went wrong. Try again in a moment.";
        statusEl.classList.add("form-status-error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send message";
      }
    });
  }

  /* ------------------------------------------------------------------
     Active section nav + scroll progress
     ------------------------------------------------------------------ */
  function initSectionNav() {
    const sections = ["philosophy", "expertise", "highlights", "experience", "impact", "services", "contact"];
    const links = document.querySelectorAll(".nav-list a[data-section]");
    const header = document.querySelector(".site-header");
    if (!links.length) return;

    const headerOffset = () => (header ? header.offsetHeight + 48 : 120);

    function update() {
      const scrollPos = window.scrollY + headerOffset();
      let current = "";

      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          current = id;
        }
      });

      links.forEach((link) => {
        link.classList.toggle("active", link.dataset.section === current);
      });
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initScrollProgress() {
    const ring = document.getElementById("scrollProgressRing");
    const label = document.getElementById("scrollProgressLabel");
    const widget = document.getElementById("scrollProgress");
    if (!ring) return;

    const circumference = 2 * Math.PI * 18;
    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference);

    function update() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? window.scrollY / docHeight : 0;
      ring.style.strokeDashoffset = String(circumference * (1 - progress));
      if (label) {
        label.textContent = `${Math.round(progress * 100)}%`;
      }
      if (widget) {
        widget.classList.toggle("near-end", progress > 0.92);
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ------------------------------------------------------------------
     Network demo — DHCP, DNS, SSH
     ------------------------------------------------------------------ */
  function initNetworkDemo() {
    const clientEl = document.getElementById("clientConsole");
    const prodEl = document.getElementById("prodConsole");
    const dnsEl = document.getElementById("dnsConsole");
    const dhcpEl = document.getElementById("dhcpConsole");
    const packet = document.getElementById("netPacket");
    const steps = document.querySelectorAll(".net-step");
    const hostDhcp = document.querySelector(".net-server-dhcp");
    const hostDns = document.querySelector(".net-server-dns");
    const hostProd = document.querySelector(".net-server-prod");
    if (!clientEl || !prodEl || !dnsEl || !dhcpEl) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const serverConsoles = [prodEl, dnsEl, dhcpEl];
    const serverHosts = { dhcp: hostDhcp, dns: hostDns, ssh: hostProd };

    function clearConsoles() {
      clientEl.innerHTML = "";
      serverConsoles.forEach((el) => { el.innerHTML = ""; });
      steps.forEach((s) => s.classList.remove("net-step-active"));
      Object.values(serverHosts).forEach((host) => {
        host?.classList.remove("net-host-active");
      });
      if (packet) {
        packet.classList.remove("visible");
        packet.style.left = "12%";
      }
    }

    function addLine(container, text, className) {
      const line = document.createElement("div");
      line.className = `net-line ${className || ""}`.trim();
      line.textContent = text;
      container.appendChild(line);
      while (container.children.length > 4) {
        container.removeChild(container.firstChild);
      }
    }

    function setStep(name) {
      steps.forEach((s) => {
        s.classList.toggle("net-step-active", s.dataset.step === name);
      });
      Object.entries(serverHosts).forEach(([step, host]) => {
        host?.classList.toggle("net-host-active", step === name);
      });
    }

    function movePacket(left) {
      if (!packet) return;
      packet.classList.add("visible");
      packet.style.left = left;
    }

    const sequence = [
      { delay: 0, fn: () => { setStep("dhcp"); addLine(clientEl, "$ sudo dhclient eth0", "cmd"); } },
      { delay: 600, fn: () => addLine(clientEl, "DHCPDISCOVER on eth0 to 255.255.255.255", "dim") },
      { delay: 900, fn: () => addLine(dhcpEl, "[dhcpd] DISCOVER from 10.0.0.42 via eth0", "dim") },
      { delay: 1100, fn: () => { movePacket("22%"); addLine(dhcpEl, "[dhcpd] OFFER 10.0.0.42 to 00:11:22:33:44:55", "info"); } },
      { delay: 1300, fn: () => addLine(clientEl, "DHCPOFFER from 10.0.0.1", "info") },
      { delay: 1600, fn: () => { addLine(dhcpEl, "[dhcpd] ACK 10.0.0.42 lease 86400s", "ok"); addLine(clientEl, "DHCPACK: lease 10.0.0.42/24 gw 10.0.0.1", "ok"); } },
      { delay: 2200, fn: () => { setStep("dns"); movePacket("50%"); addLine(clientEl, "$ ssh hoolies@prod.internal", "cmd"); } },
      { delay: 2700, fn: () => addLine(clientEl, "Resolving prod.internal...", "info") },
      { delay: 3000, fn: () => addLine(dnsEl, "[named] query prod.internal IN A", "dim") },
      { delay: 3300, fn: () => addLine(dnsEl, "[named] → 10.0.0.50 (prod.internal)", "info") },
      { delay: 3700, fn: () => addLine(clientEl, "prod.internal: 10.0.0.50", "ok") },
      { delay: 4100, fn: () => { setStep("ssh"); movePacket("82%"); } },
      { delay: 4400, fn: () => addLine(prodEl, "[sshd] conn from 10.0.0.42:44102", "dim") },
      { delay: 4700, fn: () => addLine(prodEl, "[sshd] Accepted publickey for hoolies", "ok") },
      { delay: 5000, fn: () => addLine(prodEl, "[sshd] session opened", "ok") },
      { delay: 5600, fn: () => addLine(clientEl, "Welcome to prod.internal", "ok") },
      { delay: 7000, fn: clearConsoles },
    ];

    function runSequence() {
      clearConsoles();
      sequence.forEach(({ delay, fn }) => {
        setTimeout(fn, delay);
      });
      const total = sequence[sequence.length - 1].delay + 2500;
      setTimeout(runSequence, prefersReducedMotion ? 0 : total);
    }

    if (prefersReducedMotion) {
      addLine(clientEl, "$ dhclient eth0 && ssh prod.internal", "cmd");
      addLine(clientEl, "lease 10.0.0.42 · DNS ok · connected", "ok");
      addLine(dhcpEl, "[dhcpd] ACK 10.0.0.42 lease 86400s", "ok");
      addLine(dnsEl, "[named] → 10.0.0.50 (prod.internal)", "info");
      addLine(prodEl, "[sshd] session opened for hoolies", "ok");
      setStep("ssh");
      hostProd?.classList.add("net-host-active");
      return;
    }

    runSequence();
  }

  /* ------------------------------------------------------------------
     Cost reduction carousel
     ------------------------------------------------------------------ */
  function initCostCarousel() {
    const carousel = document.getElementById("costCarousel");
    const track = document.getElementById("costCarouselTrack");
    const viewport = document.getElementById("costCarouselViewport");
    const nav = document.getElementById("costCarouselNav");
    const counterEl = document.getElementById("costCarouselCounter");
    if (!carousel || !track || !nav) return;

    const slides = [...track.querySelectorAll(".cost-carousel-slide")];
    if (!slides.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      carousel.classList.add("cost-carousel-static");
      if (counterEl) counterEl.textContent = `${slides.length} items`;
      return;
    }

    let current = 0;
    let timer = null;
    let animating = false;

    const progressBar = document.createElement("span");
    progressBar.className = "cost-carousel-progress";
    progressBar.setAttribute("aria-hidden", "true");
    const progressFill = document.createElement("span");
    progressFill.className = "cost-carousel-progress-fill";
    progressBar.appendChild(progressFill);

    if (counterEl) {
      nav.insertBefore(progressBar, counterEl);
    } else {
      nav.appendChild(progressBar);
    }

    function updateNav(index) {
      if (counterEl) {
        counterEl.innerHTML = `<span class="cost-carousel-current">${index + 1}</span> / ${slides.length}`;
      }
      progressFill.style.width = `${((index + 1) / slides.length) * 100}%`;
    }

    function setActive(index) {
      updateNav(index);
    }

    function goTo(next, direction) {
      if (animating || next === current) return false;
      animating = true;

      const outgoing = slides[current];
      const incoming = slides[next];

      outgoing.classList.remove("active");
      outgoing.classList.add(direction >= 0 ? "exit-anticlockwise" : "exit-clockwise");

      incoming.classList.remove("exit-anticlockwise", "exit-clockwise");
      incoming.classList.add("active");

      current = next;
      setActive(current);

      setTimeout(() => {
        outgoing.classList.remove("exit-anticlockwise", "exit-clockwise");
        animating = false;
      }, 560);

      return true;
    }

    function prev() {
      const next = (current - 1 + slides.length) % slides.length;
      if (goTo(next, -1)) restartTimer();
    }

    function next() {
      const nextIndex = (current + 1) % slides.length;
      if (goTo(nextIndex, 1)) restartTimer();
    }

    function restartTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(next, 5500);
    }

    carousel.carouselApi = { prev, next, goTo };
    window.__costCarouselApi = carousel.carouselApi;

    slides[0].classList.add("active");
    setActive(0);
    restartTimer();

    const advanceOnClick = (event) => {
      event.preventDefault();
      next();
    };

    if (viewport) {
      viewport.addEventListener("click", advanceOnClick);
    }

    nav.addEventListener("click", advanceOnClick);

    carousel.addEventListener("mouseenter", () => {
      if (timer) clearInterval(timer);
    });

    carousel.addEventListener("mouseleave", restartTimer);
  }

  function handleCarouselKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return false;

    const carousel = document.getElementById("costCarousel");
    const api = carousel?.carouselApi || window.__costCarouselApi;
    if (!api) return false;

    const el = document.activeElement;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) {
      return false;
    }

    const code = event.code;
    if (code === "KeyH" || code === "ArrowLeft") {
      event.preventDefault();
      event.stopImmediatePropagation();
      api.prev();
      return true;
    }

    if (code === "KeyL" || code === "ArrowRight") {
      event.preventDefault();
      event.stopImmediatePropagation();
      api.next();
      return true;
    }

    return false;
  }

  /* ------------------------------------------------------------------
     Vim-style keyboard navigation
     ------------------------------------------------------------------ */
  function initKeyboardNav() {
    const sections = ["top", "philosophy", "expertise", "highlights", "experience", "impact", "services", "contact"];
    const header = document.querySelector(".site-header");
    let lastGAt = 0;

    function isTypingTarget() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    }

    function headerOffset() {
      return header ? header.offsetHeight + 48 : 120;
    }

    function currentSectionIndex() {
      const scrollPos = window.scrollY + headerOffset();
      let index = 0;

      sections.forEach((id, i) => {
        const el = id === "top" ? document.getElementById("top") : document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          index = i;
        }
      });

      return index;
    }

    function scrollToSection(id) {
      const el = id === "top" ? document.getElementById("top") : document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    document.addEventListener("keydown", (event) => {
      if (isTypingTarget()) return;

      if (event.key === "g") {
        const now = Date.now();
        if (now - lastGAt < 450) {
          event.preventDefault();
          scrollToSection("top");
          lastGAt = 0;
        } else {
          lastGAt = now;
        }
        return;
      }

      if (event.key === "G") {
        event.preventDefault();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
        return;
      }

      if (event.key === "j") {
        event.preventDefault();
        const index = currentSectionIndex();
        if (index < sections.length - 1) {
          scrollToSection(sections[index + 1]);
        }
        return;
      }

      if (event.key === "k") {
        event.preventDefault();
        const index = currentSectionIndex();
        if (index > 0) {
          scrollToSection(sections[index - 1]);
        }
      }
    });

    window.addEventListener("keydown", (event) => {
      handleCarouselKey(event);
    }, true);
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
    initSectionNav();
    initScrollProgress();
    initNetworkDemo();
    initCostCarousel();
    initKeyboardNav();
    initContactForm();
    initFooter();
  });
})();
