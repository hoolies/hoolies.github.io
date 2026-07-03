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
    const terminalWindow = document.getElementById("terminalWindow");
    const terminalBody = document.getElementById("terminalBody");
    const tmuxBar = document.getElementById("terminalTmuxBar");
    const promptEls = [
      document.getElementById("terminalPrompt"),
      document.getElementById("terminalPromptUptime"),
      document.getElementById("terminalPromptCmd"),
    ].filter(Boolean);

    if (!uptimeEl || !commandEl || !outputEl) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const sessionHosts = {
      incident: "prod",
      consulting: "edge-yhm",
      training: "workshop",
    };

    const commandSets = {
      incident: [
        { cmd: "ssh hoolies@prod -t 'tmux attach -t incident'", output: "[incident] 3 windows (attached)" },
        { cmd: "ssh cisco-core01 'show ip bgp summary'", output: "BGP router identifier 10.0.0.1 · 42 routes · 0 flaps" },
        { cmd: "nc -zv db.internal 22 443 5432", output: "Connection to db.internal 22 port [tcp/ssh] succeeded!" },
        { cmd: 'sudo vim -q <(grep -rni "error" /var/log/)', output: "/var/log/syslog:1842: error: connection reset by peer" },
        { cmd: "htop", output: "CPU ████░░░░░░ 42% · MEM 6.2G/16G · load 0.42 0.38 0.31" },
      ],
      consulting: [
        { cmd: "ansible-playbook station-template.yml --limit cell-03", output: "PLAY RECAP · cell-03 · ok=14 changed=2 unreachable=0" },
        { cmd: "udevadm monitor --environment", output: "UDEV [change] /devices/ttyUSB0 (usb) · scanner reattached" },
        { cmd: "ssh juniper-fw01 'show route table inet.0'", output: "inet.0: 128 destinations, 512 routes (128 active)" },
        { cmd: "proxychains4 -q curl ifconfig.me", output: "203.0.113.42" },
        { cmd: "nmap -sV --top-ports 100 10.20.30.0/24", output: "Nmap done: 256 IP addresses · 12 hosts up · 0.84s elapsed" },
      ],
      training: [
        { cmd: "cursor agent mcp list", output: "linux-docs · github · slack · 3 servers connected" },
        { cmd: "man fundamentals", output: "NAME fundamentals — train from first principles, not slide decks" },
        { cmd: "ssh workshop 'labctl status'", output: "lab: tcp-ip · 12 learners · module 3/8 active" },
        { cmd: "git -C curriculum log --oneline -3", output: "a1b2c3d Add chaos engineering lab\nf4e5d6c BGP troubleshooting module\nc7d8e9f Linux namespaces workshop" },
      ],
    };

    let session = "incident";
    let commands = commandSets[session];
    let cmdIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let typeTimer = null;

    function setPrompts(host) {
      const text = `chrysanthos@${host} ~ $`;
      promptEls.forEach((el) => { el.textContent = text; });
    }

    function setSession(next) {
      session = next;
      commands = commandSets[session];
      cmdIndex = 0;
      charIndex = 0;
      deleting = false;
      commandEl.textContent = "";
      outputEl.textContent = "";
      setPrompts(sessionHosts[session]);

      if (tmuxBar) {
        tmuxBar.querySelectorAll(".terminal-tmux-tab").forEach((tab) => {
          const active = tab.dataset.session === session;
          tab.classList.toggle("active", active);
          tab.setAttribute("aria-selected", active ? "true" : "false");
        });
      }
    }

    setTimeout(() => {
      uptimeEl.textContent = "30 years on Linux, load average: calm under pressure";
      requestAnimationFrame(lockTerminalHeight);
    }, 800);

    function hideOutput() {
      outputEl.textContent = "";
    }

    function showOutput(text) {
      outputEl.textContent = text;
    }

    function lockTerminalHeight() {
      if (!terminalBody || !terminalWindow) return;

      terminalWindow.style.removeProperty("height");
      terminalWindow.style.removeProperty("min-height");
      terminalBody.style.removeProperty("height");
      terminalBody.style.removeProperty("min-height");
      terminalBody.style.removeProperty("max-height");

      const allCommands = Object.values(commandSets).flat();
      const savedCmd = commandEl.textContent;
      const savedOut = outputEl.textContent;

      let maxOutputLines = 1;
      allCommands.forEach(({ output }) => {
        maxOutputLines = Math.max(maxOutputLines, output.split("\n").length);
      });

      const lineHeight = parseFloat(getComputedStyle(terminalBody).lineHeight) || 22;
      const outputHeight = Math.ceil(maxOutputLines * lineHeight + 4);
      document.documentElement.style.setProperty("--terminal-output-h", `${outputHeight}px`);

      let maxWindow = 0;
      let bodyAtMax = 0;

      const measure = (cmd, output) => {
        commandEl.textContent = cmd;
        outputEl.textContent = output;
        const winH = terminalWindow.offsetHeight;
        if (winH >= maxWindow) {
          maxWindow = winH;
          bodyAtMax = terminalBody.scrollHeight;
        }
      };

      measure("", "");
      allCommands.forEach(({ cmd, output }) => measure(cmd, output));

      commandEl.textContent = savedCmd;
      outputEl.textContent = savedOut;

      document.documentElement.style.setProperty("--terminal-body-h", `${bodyAtMax}px`);
      document.documentElement.style.setProperty("--terminal-window-h", `${maxWindow}px`);
      terminalWindow.style.height = `${maxWindow}px`;
      terminalWindow.style.minHeight = `${maxWindow}px`;
      terminalBody.style.height = `${bodyAtMax}px`;
      terminalBody.style.minHeight = `${bodyAtMax}px`;
      terminalBody.style.maxHeight = `${bodyAtMax}px`;
    }

    function skipToNext() {
      if (typeTimer) clearTimeout(typeTimer);
      deleting = true;
      charIndex = commands[cmdIndex].cmd.length;
      hideOutput();
      commandEl.textContent = "";
      deleting = false;
      cmdIndex = (cmdIndex + 1) % commands.length;
      charIndex = 0;
      typeLoop();
    }

    function typeLoop() {
      const current = commands[cmdIndex];

      if (!deleting) {
        commandEl.textContent = current.cmd.slice(0, charIndex + 1);
        charIndex++;

        if (charIndex === current.cmd.length) {
          showOutput(current.output);
          typeTimer = setTimeout(() => { deleting = true; typeLoop(); }, prefersReducedMotion ? 4000 : 2200);
          return;
        }
      } else {
        hideOutput();
        commandEl.textContent = "";
        deleting = false;
        cmdIndex = (cmdIndex + 1) % commands.length;
        charIndex = 0;
        typeTimer = setTimeout(typeLoop, 200);
        return;
      }

      typeTimer = setTimeout(typeLoop, 65);
    }

    if (tmuxBar) {
      tmuxBar.querySelectorAll(".terminal-tmux-tab").forEach((tab) => {
        tab.addEventListener("click", (event) => {
          event.stopPropagation();
          setSession(tab.dataset.session || "incident");
          lockTerminalHeight();
          if (!prefersReducedMotion) typeLoop();
        });
      });
    }

    if (terminalWindow) {
      terminalWindow.addEventListener("click", () => {
        if (!prefersReducedMotion) skipToNext();
      });
    }

    setPrompts(sessionHosts[session]);
    requestAnimationFrame(() => {
      lockTerminalHeight();
    });
    window.addEventListener("resize", () => {
      requestAnimationFrame(lockTerminalHeight);
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(lockTerminalHeight);
    }

    if (!prefersReducedMotion) {
      setTimeout(typeLoop, 1600);
    } else {
      commandEl.textContent = commands[0].cmd;
      showOutput(commands[0].output);
    }
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

    const sequence = [
      { delay: 0, fn: () => { setStep("dhcp"); addLine(clientEl, "$ sudo dhclient eth0", "cmd"); } },
      { delay: 600, fn: () => addLine(clientEl, "DHCPDISCOVER on eth0 to 255.255.255.255", "dim") },
      { delay: 900, fn: () => addLine(dhcpEl, "[dhcpd] DISCOVER from 10.0.0.42 via eth0", "dim") },
      { delay: 1100, fn: () => addLine(dhcpEl, "[dhcpd] OFFER 10.0.0.42 to 00:11:22:33:44:55", "info") },
      { delay: 1300, fn: () => addLine(clientEl, "DHCPOFFER from 10.0.0.1", "info") },
      { delay: 1600, fn: () => { addLine(dhcpEl, "[dhcpd] ACK 10.0.0.42 lease 86400s", "ok"); addLine(clientEl, "DHCPACK: lease 10.0.0.42/24 gw 10.0.0.1", "ok"); } },
      { delay: 2200, fn: () => { setStep("dns"); addLine(clientEl, "$ ssh hoolies@prod.internal", "cmd"); } },
      { delay: 2700, fn: () => addLine(clientEl, "Resolving prod.internal...", "info") },
      { delay: 3000, fn: () => addLine(dnsEl, "[named] query prod.internal IN A", "dim") },
      { delay: 3300, fn: () => addLine(dnsEl, "[named] → 10.0.0.50 (prod.internal)", "info") },
      { delay: 3700, fn: () => addLine(clientEl, "prod.internal: 10.0.0.50", "ok") },
      { delay: 4100, fn: () => setStep("ssh") },
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
    const groupEl = document.getElementById("costCarouselGroup");
    if (!carousel || !track || !nav) return;

    const slides = [...track.querySelectorAll(".cost-carousel-slide")];
    if (!slides.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      carousel.classList.add("cost-carousel-static");
      return;
    }

    let current = 0;
    let timer = null;
    let animating = false;

    const progressBar = document.createElement("span");
    progressBar.className = "cost-carousel-progress";
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", String(slides.length));
    progressBar.setAttribute("aria-valuenow", "1");
    progressBar.setAttribute("aria-label", "Cost reduction slide progress");
    const progressFill = document.createElement("span");
    progressFill.className = "cost-carousel-progress-fill";
    progressBar.appendChild(progressFill);
    nav.appendChild(progressBar);

    function updateNav(index) {
      progressFill.style.width = `${((index + 1) / slides.length) * 100}%`;
      progressBar.setAttribute("aria-valuenow", String(index + 1));
      if (groupEl && slides[index]?.dataset.group) {
        groupEl.textContent = slides[index].dataset.group;
      }
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
    const shortcutsOverlay = document.getElementById("shortcutsOverlay");
    const shortcutsClose = document.getElementById("shortcutsClose");

    function isTypingTarget() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    }

    function openShortcuts() {
      if (!shortcutsOverlay) return;
      shortcutsOverlay.hidden = false;
      shortcutsClose?.focus();
    }

    function closeShortcuts() {
      if (!shortcutsOverlay) return;
      shortcutsOverlay.hidden = true;
    }

    shortcutsClose?.addEventListener("click", closeShortcuts);
    shortcutsOverlay?.addEventListener("click", (event) => {
      if (event.target === shortcutsOverlay) closeShortcuts();
    });

    function headerOffset() {
      return header ? header.offsetHeight + 16 : 88;
    }

    function currentSectionIndex() {
      if (window.scrollY < 100) {
        return 0;
      }

      const scrollPos = window.scrollY + headerOffset();
      let index = 0;

      for (let i = 1; i < sections.length; i++) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          index = i;
        }
      }

      return index;
    }

    function scrollToSection(id) {
      if (id === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function handleSectionKey(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget()) return;

      const code = event.code;

      if (code === "KeyG" && !event.shiftKey) {
        event.preventDefault();
        scrollToSection("top");
        return;
      }

      if (code === "KeyG" && event.shiftKey) {
        event.preventDefault();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
        return;
      }

      if (code === "KeyJ") {
        event.preventDefault();
        const index = currentSectionIndex();
        if (index < sections.length - 1) {
          scrollToSection(sections[index + 1]);
        }
        return;
      }

      if (code === "KeyK") {
        event.preventDefault();
        const index = currentSectionIndex();
        if (index > 0) {
          scrollToSection(sections[index - 1]);
        }
      }
    }

    function handleShortcutsKey(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget()) return;

      if (event.code === "Slash" && event.shiftKey) {
        event.preventDefault();
        if (!shortcutsOverlay) return;
        if (shortcutsOverlay.hidden) {
          openShortcuts();
        } else {
          closeShortcuts();
        }
        return;
      }

      if (event.code === "Escape" && shortcutsOverlay && !shortcutsOverlay.hidden) {
        event.preventDefault();
        closeShortcuts();
      }
    }

    window.addEventListener("keydown", (event) => {
      handleSectionKey(event);
      handleCarouselKey(event);
      handleShortcutsKey(event);
    }, true);
  }

  /* ------------------------------------------------------------------
     Scroll depth — hero fade + subtle terminal tilt
     ------------------------------------------------------------------ */
  function initParallax() {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hero = document.querySelector(".hero");
    const heroTerminal = document.querySelector(".hero-terminal");
    const terminalWindow = document.getElementById("terminalWindow");
    let ticking = false;

    function clearEffects() {
      document.documentElement.style.setProperty("--hero-progress", "0");
      heroTerminal?.style.removeProperty("--mouse-tilt-x");
      heroTerminal?.style.removeProperty("--mouse-tilt-y");
    }

    function updateScroll() {
      if (!hero || motionQuery.matches) {
        ticking = false;
        return;
      }

      const rect = hero.getBoundingClientRect();
      const scrollRange = Math.max(hero.offsetHeight - window.innerHeight * 0.35, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollRange);
      const progress = scrolled / scrollRange;

      document.documentElement.style.setProperty("--hero-progress", progress.toFixed(4));
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScroll);
      }
    }

    function onHeroMove(event) {
      if (!heroTerminal || !terminalWindow || motionQuery.matches) return;

      const rect = heroTerminal.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const tiltX = Math.max(-2.5, Math.min(2.5, -y * 5));
      const tiltY = Math.max(-2.5, Math.min(2.5, x * 5));

      heroTerminal.style.setProperty("--mouse-tilt-x", `${tiltX}deg`);
      heroTerminal.style.setProperty("--mouse-tilt-y", `${tiltY}deg`);
    }

    function onHeroLeave() {
      heroTerminal?.style.setProperty("--mouse-tilt-x", "0deg");
      heroTerminal?.style.setProperty("--mouse-tilt-y", "0deg");
    }

    motionQuery.addEventListener("change", (event) => {
      if (event.matches) clearEffects();
      else updateScroll();
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    heroTerminal?.addEventListener("mousemove", onHeroMove, { passive: true });
    heroTerminal?.addEventListener("mouseleave", onHeroLeave, { passive: true });

    if (!motionQuery.matches) {
      updateScroll();
    }
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
    initParallax();
    initFooter();
  });
})();
