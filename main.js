/**
 * NOCTIS — Scrollytelling Engine & Interactive Controller
 * Vanilla JavaScript: Canvas frame scrubber, noise generator, custom cursor,
 * word-by-word statement reveal, hover accordion, and accessibility handling.
 */

document.addEventListener('DOMContentLoaded', () => {

  const config = window.CONFIG;
  if (!config) {
    console.error('NOCTIS Config not found.');
    return;
  }

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Viewport State
  let isMobile = window.innerWidth < config.rendering.mobileBreakpoint;
  let dpr = Math.min(window.devicePixelRatio || 1, config.rendering.canvasDprCap);

  // Set Section Heights from Config
  const heroWrapper = document.querySelector('.hero-wrapper');
  const dismantleWrapper = document.querySelector('.dismantle-wrapper');
  if (heroWrapper) heroWrapper.style.height = config.heroHeight;
  if (dismantleWrapper) dismantleWrapper.style.height = config.dismantleHeight;

  // ==========================================================================
  // 1. FILM-GRAIN NOISE OVERLAY (Offscreen Noise Canvas, ~8 shifts/sec)
  // ==========================================================================
  const grainCanvas = document.getElementById('grain-canvas');
  if (grainCanvas) {
    const grainCtx = grainCanvas.getContext('2d');
    const patternSize = 128;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = patternSize;
    offCanvas.height = patternSize;
    const offCtx = offCanvas.getContext('2d');
    const imgData = offCtx.createImageData(patternSize, patternSize);
    const buffer32 = new Uint32Array(imgData.data.buffer);

    // Generate random noise
    for (let i = 0; i < buffer32.length; i++) {
      const shade = Math.floor(Math.random() * 255);
      // RGBA in little endian
      buffer32[i] = (255 << 24) | (shade << 16) | (shade << 8) | shade;
    }
    offCtx.putImageData(imgData, 0, 0);

    function resizeGrain() {
      grainCanvas.width = window.innerWidth;
      grainCanvas.height = window.innerHeight;
    }
    resizeGrain();
    window.addEventListener('resize', resizeGrain);

    // Render noise shifted randomly ~8 times per second (every 125ms)
    setInterval(() => {
      if (!grainCtx) return;
      grainCtx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
      const pattern = grainCtx.createPattern(offCanvas, 'repeat');
      if (pattern) {
        grainCtx.save();
        const offsetX = Math.floor(Math.random() * patternSize);
        const offsetY = Math.floor(Math.random() * patternSize);
        grainCtx.translate(offsetX, offsetY);
        grainCtx.fillStyle = pattern;
        grainCtx.fillRect(-offsetX, -offsetY, grainCanvas.width + patternSize, grainCanvas.height + patternSize);
        grainCtx.restore();
      }
    }, 125);
  }

  // ==========================================================================
  // 2. CUSTOM CURSOR ("THE HEADLIGHT", Desktop Only)
  // ==========================================================================
  const customCursor = document.getElementById('custom-cursor');
  const cursorLabel = customCursor ? customCursor.querySelector('.cursor-label') : null;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let isHovering = false;
  let isDown = false;

  if (customCursor && window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Mousedown flash for 120ms
    window.addEventListener('mousedown', () => {
      if (!customCursor) return;
      customCursor.classList.add('is-down');
      setTimeout(() => {
        customCursor.classList.remove('is-down');
      }, 120);
    });

    // Smooth Cursor Render Loop
    function updateCursor() {
      cursorX += (mouseX - cursorX) * config.rendering.cursorLerp;
      cursorY += (mouseY - cursorY) * config.rendering.cursorLerp;
      customCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      requestAnimationFrame(updateCursor);
    }
    requestAnimationFrame(updateCursor);

    // Hover Target Delegations
    function setupCursorListeners() {
      const hoverTargets = document.querySelectorAll('a, button, [role="button"], [data-cursor]');
      hoverTargets.forEach((target) => {
        target.addEventListener('mouseenter', () => {
          customCursor.classList.add('is-hovering');
          const customText = target.dataset.cursor;
          if (cursorLabel) {
            cursorLabel.textContent = customText || 'VIEW';
          }
        });
        target.addEventListener('mouseleave', () => {
          customCursor.classList.remove('is-hovering');
          if (cursorLabel) cursorLabel.textContent = '';
        });
      });
    }
    setupCursorListeners();
  }

  // ==========================================================================
  // 3. FRAME ASSET LOADING ENGINE
  // ==========================================================================
  const heroFrames = new Array(config.heroFrameCount);
  const dismantleFrames = new Array(config.dismantleFrameCount);

  function getFrameUrl(type, index) {
    const padded = String(index).padStart(4, '0');
    if (type === 'hero') {
      const template = isMobile ? config.paths.heroMobile : config.paths.heroDesktop;
      return template.replace('{index}', padded);
    } else {
      const template = isMobile ? config.paths.dismantleMobile : config.paths.dismantleDesktop;
      return template.replace('{index}', padded);
    }
  }

  function loadSingleFrame(type, index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if ('decode' in img) {
          img.decode().then(() => resolve(img)).catch(() => resolve(img));
        } else {
          resolve(img);
        }
      };
      img.onerror = () => resolve(null);
      img.src = getFrameUrl(type, index);
    });
  }

  // Preloader Elements
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  const preloaderCounter = document.getElementById('preloader-counter');

  // Progressive Preload Sequence
  async function runPreloader() {
    const initialCount = config.rendering.preloadHeroInitial;
    let initialLoaded = 0;

    // Load initial 40 hero frames to unlock page
    for (let i = 1; i <= initialCount; i++) {
      const img = await loadSingleFrame('hero', i);
      if (img) heroFrames[i - 1] = img;
      initialLoaded++;

      const pct = Math.round((initialLoaded / initialCount) * 100);
      if (preloaderBar) preloaderBar.style.width = `${pct}%`;
      if (preloaderCounter) preloaderCounter.textContent = String(pct).padStart(3, '0');
    }

    // Initial load complete: flash bar white and reveal page
    if (preloader) {
      preloader.classList.add('flash');
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.classList.remove('no-scroll');
      }, 250);
    }

    // Background load the remaining hero frames in chunks
    loadRemainingFramesBackground();
  }

  async function loadRemainingFramesBackground() {
    const chunkSize = 16;
    // Remaining hero frames
    for (let i = config.rendering.preloadHeroInitial + 1; i <= config.heroFrameCount; i += chunkSize) {
      const promises = [];
      for (let j = i; j < i + chunkSize && j <= config.heroFrameCount; j++) {
        const frameIdx = j;
        promises.push(
          loadSingleFrame('hero', frameIdx).then((img) => {
            if (img) heroFrames[frameIdx - 1] = img;
          })
        );
      }
      await Promise.all(promises);
    }

    // Dismantle frames in chunks
    for (let i = 1; i <= config.dismantleFrameCount; i += chunkSize) {
      const promises = [];
      for (let j = i; j < i + chunkSize && j <= config.dismantleFrameCount; j++) {
        const frameIdx = j;
        promises.push(
          loadSingleFrame('dismantle', frameIdx).then((img) => {
            if (img) dismantleFrames[frameIdx - 1] = img;
          })
        );
      }
      await Promise.all(promises);
    }
  }

  // ==========================================================================
  // 4. CANVAS DRAWING (Cover on Landscape, Contain on Portrait)
  // ==========================================================================
  function drawCanvasImage(targetCanvas, targetCtx, img) {
    if (!targetCanvas || !targetCtx || !img) return;

    const canvasWidth = targetCanvas.width / dpr;
    const canvasHeight = targetCanvas.height / dpr;
    const isPortrait = canvasHeight > canvasWidth;

    targetCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (isPortrait) {
      // Portrait: contain-fit, vertically centered on --asphalt (#07080A)
      const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvasWidth - w) / 2;
      const y = (canvasHeight - h) / 2;

      targetCtx.fillStyle = '#07080A';
      targetCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      targetCtx.drawImage(img, x, y, w, h);
    } else {
      // Landscape: cover-fit
      const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvasWidth - w) / 2;
      const y = (canvasHeight - h) / 2;

      targetCtx.drawImage(img, x, y, w, h);
    }
  }

  function getNearestLoadedFrame(frameArray, targetIdx) {
    if (frameArray[targetIdx]) return frameArray[targetIdx];
    // Search nearby loaded frame
    let offset = 1;
    while (targetIdx - offset >= 0 || targetIdx + offset < frameArray.length) {
      if (targetIdx - offset >= 0 && frameArray[targetIdx - offset]) {
        return frameArray[targetIdx - offset];
      }
      if (targetIdx + offset < frameArray.length && frameArray[targetIdx + offset]) {
        return frameArray[targetIdx + offset];
      }
      offset++;
    }
    return null;
  }

  // ==========================================================================
  // 5. PINNED HERO SCROLLYTELLING LOGIC
  // ==========================================================================
  const heroCanvas = document.getElementById('hero-canvas');
  const heroCtx = heroCanvas ? heroCanvas.getContext('2d') : null;
  const heroProgressLine = document.getElementById('hero-progress-line');
  const heroFadeOverlay = document.getElementById('hero-fade-overlay');
  const hudChapterText = document.getElementById('hud-chapter-text');
  const hudSpeed = document.getElementById('hud-speed');
  const hudDist = document.getElementById('hud-dist');
  const heroChapters = document.querySelectorAll('.hero-chapter');

  let heroCurrentFrame = 0;
  let heroLastRenderedFrame = -1;

  function resizeCanvas(canvasElement, context) {
    if (!canvasElement || !context) return;
    const rect = canvasElement.getBoundingClientRect();
    canvasElement.width = rect.width * dpr;
    canvasElement.height = rect.height * dpr;
    context.scale(dpr, dpr);
  }

  function setupCanvases() {
    dpr = Math.min(window.devicePixelRatio || 1, config.rendering.canvasDprCap);
    isMobile = window.innerWidth < config.rendering.mobileBreakpoint;
    resizeCanvas(heroCanvas, heroCtx);
    resizeCanvas(dismantleCanvas, dismantleCtx);
    heroLastRenderedFrame = -1;
    dismantleLastRenderedFrame = -1;
  }

  window.addEventListener('resize', setupCanvases);

  // ==========================================================================
  // 6. STATEMENT WORD-BY-WORD SCROLL REVEAL (Section 2)
  // ==========================================================================
  const statementQuote = document.getElementById('statement-text');
  let statementWords = [];

  if (statementQuote) {
    const rawText = statementQuote.textContent.trim();
    statementQuote.innerHTML = '';
    const words = rawText.split(/\s+/);
    words.forEach((w) => {
      const span = document.createElement('span');
      span.className = 'statement-word';
      span.textContent = w;
      statementQuote.appendChild(span);
      statementWords.push(span);
    });
  }

  const statementSection = document.getElementById('statement');

  function updateStatementReveal() {
    if (!statementSection || statementWords.length === 0) return;
    const rect = statementSection.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Progress 0 when section enters bottom, 1 when centered
    const startY = windowH;
    const endY = windowH * 0.25;
    const rawProgress = (startY - rect.top) / (startY - endY);
    const progress = Math.max(0, Math.min(1, rawProgress));

    const activeWordCount = Math.floor(progress * statementWords.length);
    statementWords.forEach((wordSpan, idx) => {
      if (idx <= activeWordCount) {
        wordSpan.style.opacity = '1';
      } else {
        wordSpan.style.opacity = '0.15';
      }
    });
  }

  // ==========================================================================
  // 7. PINNED DISMANTLE SCROLLYTELLING LOGIC (Section 3)
  // ==========================================================================
  const dismantleCanvas = document.getElementById('dismantle-canvas');
  const dismantleCtx = dismantleCanvas ? dismantleCanvas.getContext('2d') : null;
  const dismantleProgressLine = document.getElementById('dismantle-progress-line');
  const calloutNodes = {
    body: document.getElementById('callout-body'),
    light: document.getElementById('callout-light'),
    drive: document.getElementById('callout-drive'),
    battery: document.getElementById('callout-battery')
  };

  let dismantleCurrentFrame = 0;
  let dismantleLastRenderedFrame = -1;

  function updateDismantleCallouts(progress) {
    // Reveal after 70% progress
    config.dismantleCallouts.forEach((callout) => {
      const el = calloutNodes[callout.id];
      if (!el) return;
      if (progress >= callout.revealAt) {
        el.classList.add('is-visible');
      } else {
        el.classList.remove('is-visible');
      }
    });
  }

  // ==========================================================================
  // 8. MASTER ANIMATION & SCROLL LOOP (Single requestAnimationFrame)
  // ==========================================================================
  function masterScrollyLoop() {
    if (prefersReducedMotion) return;

    // --- HERO SECTION ---
    if (heroWrapper && heroCanvas && heroCtx) {
      const rect = heroWrapper.getBoundingClientRect();
      const maxScroll = heroWrapper.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, maxScroll)));

      const targetFrame = Math.round(progress * (config.heroFrameCount - 1));
      heroCurrentFrame += (targetFrame - heroCurrentFrame) * config.rendering.lerpFactor;
      const roundedFrame = Math.round(heroCurrentFrame);

      if (roundedFrame !== heroLastRenderedFrame) {
        const frameImg = getNearestLoadedFrame(heroFrames, roundedFrame);
        if (frameImg) {
          drawCanvasImage(heroCanvas, heroCtx, frameImg);
          heroLastRenderedFrame = roundedFrame;
        }
      }

      // Update 1px xenon bottom progress line
      if (heroProgressLine) {
        heroProgressLine.style.transform = `scaleX(${progress})`;
      }

      // Over the last 5% of scroll, canvas fades to solid black
      if (heroFadeOverlay) {
        if (progress >= config.heroTelemetry.fadeToBlackStart) {
          const fadeProgress = (progress - config.heroTelemetry.fadeToBlackStart) / (1 - config.heroTelemetry.fadeToBlackStart);
          heroFadeOverlay.style.opacity = String(fadeProgress);
        } else {
          heroFadeOverlay.style.opacity = '0';
        }
      }

      // Telemetry HUD Counters
      const currentSpeed = Math.round(progress * config.heroTelemetry.maxSpeed);
      const currentDist = (progress * config.heroTelemetry.maxDistance).toFixed(1);
      if (hudSpeed) hudSpeed.textContent = `${String(currentSpeed).padStart(3, '0')} KM/H`;
      if (hudDist) hudDist.textContent = `${currentDist} KM`;

      // Text Chapters Transition
      config.heroChapters.forEach((ch) => {
        const [start, end] = ch.range;
        const isActive = progress >= start && progress <= end;
        const chEl = document.querySelector(`.hero-chapter[data-chapter="${ch.id}"]`);
        if (chEl) {
          if (isActive) {
            chEl.classList.add('active');
            if (hudChapterText) hudChapterText.textContent = ch.hudChapter;
          } else {
            chEl.classList.remove('active');
          }
        }
      });
    }

    // --- STATEMENT SECTION REVEAL ---
    updateStatementReveal();

    // --- DISMANTLE SECTION ---
    if (dismantleWrapper && dismantleCanvas && dismantleCtx) {
      const rect = dismantleWrapper.getBoundingClientRect();
      const maxScroll = dismantleWrapper.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, maxScroll)));

      const targetFrame = Math.round(progress * (config.dismantleFrameCount - 1));
      dismantleCurrentFrame += (targetFrame - dismantleCurrentFrame) * config.rendering.lerpFactor;
      const roundedFrame = Math.round(dismantleCurrentFrame);

      if (roundedFrame !== dismantleLastRenderedFrame) {
        const frameImg = getNearestLoadedFrame(dismantleFrames, roundedFrame);
        if (frameImg) {
          drawCanvasImage(dismantleCanvas, dismantleCtx, frameImg);
          dismantleLastRenderedFrame = roundedFrame;
        }
      }

      // Update 1px progress line
      if (dismantleProgressLine) {
        dismantleProgressLine.style.transform = `scaleX(${progress})`;
      }

      // Callouts after 70% progress
      updateDismantleCallouts(progress);
    }

    requestAnimationFrame(masterScrollyLoop);
  }

  // ==========================================================================
  // 9. LINEUP ACCORDION (Desktop Hover + Mobile/Touch Tap + Keyboard Nav)
  // ==========================================================================
  const accordionContainer = document.getElementById('lineup-accordion');
  const slides = document.querySelectorAll('.lineup-slide');
  let hoverTimeout = null;

  function setActiveSlide(targetIndex) {
    slides.forEach((slide, idx) => {
      const isOpen = idx === targetIndex;
      slide.classList.toggle('is-open', isOpen);
      slide.setAttribute('aria-expanded', String(isOpen));
    });

    // Update cursor label if mouse is hovering over open/closed slide
    if (customCursor && customCursor.classList.contains('is-hovering') && cursorLabel) {
      cursorLabel.textContent = 'CONFIGURE';
    }
  }

  slides.forEach((slide, idx) => {
    // Desktop Hover with 80ms debounce
    slide.addEventListener('mouseenter', () => {
      if (isMobile) return;
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        setActiveSlide(idx);
      }, config.rendering.accordionDebounceMs);

      if (cursorLabel) {
        cursorLabel.textContent = slide.classList.contains('is-open') ? 'CONFIGURE' : 'OPEN';
      }
    });

    // Tap/Click for Touch and Keyboard
    slide.addEventListener('click', () => {
      setActiveSlide(idx);
    });

    // Color Swatches interaction
    const swatches = slide.querySelectorAll('.swatch');
    swatches.forEach((swatch) => {
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        swatches.forEach((s) => s.classList.remove('active'));
        swatch.classList.add('active');
      });
    });
  });

  // Keyboard Navigation (Arrow Keys between slides)
  if (accordionContainer) {
    accordionContainer.addEventListener('keydown', (e) => {
      const currentOpen = Array.from(slides).findIndex((s) => s.classList.contains('is-open'));
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (currentOpen + 1) % slides.length;
        setActiveSlide(next);
        slides[next].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (currentOpen - 1 + slides.length) % slides.length;
        setActiveSlide(prev);
        slides[prev].focus();
      }
    });
  }

  // Lineup Section Scroll Entrance Animation (Stagger rise 40px + fade)
  const lineupSection = document.getElementById('lineup');
  if (lineupSection && 'IntersectionObserver' in window) {
    const lineupObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            slides.forEach((s, i) => {
              s.style.opacity = '0';
              s.style.transform = 'translateY(40px)';
              s.style.transition = `transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s, opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s`;
              requestAnimationFrame(() => {
                s.style.opacity = '1';
                s.style.transform = 'translateY(0)';
              });
            });
            lineupObserver.unobserve(lineupSection);
          }
        });
      },
      { threshold: 0.15 }
    );
    lineupObserver.observe(lineupSection);
  }

  // ==========================================================================
  // 10. NAV HIDE ON SCROLL DOWN, SHOW ON SCROLL UP
  // ==========================================================================
  const siteNav = document.getElementById('site-nav');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    if (siteNav) {
      if (currentY > lastScrollY && currentY > 100) {
        siteNav.classList.add('nav-hidden');
      } else {
        siteNav.classList.remove('nav-hidden');
      }
    }
    lastScrollY = currentY;
  }, { passive: true });

  // ==========================================================================
  // 11. RESERVE BUTTON ACTION
  // ==========================================================================
  const reserveBtn = document.getElementById('reserve-btn');
  if (reserveBtn) {
    reserveBtn.addEventListener('click', () => {
      alert('NOCTIS Allocation: Commission inquiries are logged. The concierge will contact your verified channel.');
    });
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  setupCanvases();
  runPreloader();
  requestAnimationFrame(masterScrollyLoop);

});
