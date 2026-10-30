/**
 * NOCTIS — Streamlined Production Web Experience Controller
 * Orchestrates canvas frame scrubbers, 4K film video playback,
 * deconstruction viewer, master design lock studio, and Web Audio synthesizer.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // CHAPTER DATA & TELEMETRY
  // ==========================================================================
  const CHAPTERS = {
    1: {
      id: 1,
      kf: 'K1',
      title: 'THE WAKE',
      folder: 'clip1 frame.zip',
      frameCount: 200,
      videoSrc: 'clip 1.mp4',
      staticFallback: 'k1.png',
      quote: '"Low camera height at bumper level, 4m back. Wet empty asphalt at the edge of a vast dark city in total blackout. The only light comes from the glowing red rear bar and white headlight beams spilling into fog."',
      specs: [
        'SPEED: 0 KM/H',
        'TORQUE: STANDBY',
        'AMBIENT: 0.0 LUX',
        'SURFACE: WET ASPHALT'
      ],
      lightFront: 'ON (COOL WHITE)',
      lightRear: 'ON (DEEP RED)'
    },
    2: {
      id: 2,
      kf: 'K2',
      title: 'THE DEPARTURE',
      folder: 'clip 2 frame.zip',
      frameCount: 200,
      videoSrc: 'clip 2.mp4',
      staticFallback: 'k22.jpg',
      quote: '"15 metres further ahead, driving down the centre of a wide empty city avenue into the dark city. White headlight beams cut long cones through fog; red light streaks reflect on wet asphalt."',
      specs: [
        'SPEED: 64 KM/H',
        'TORQUE: 940 NM',
        'ACCEL: 0.65 G',
        'DRIVE: VECTOR-AWD'
      ],
      lightFront: 'ON (BEAMS IN FOG)',
      lightRear: 'ON (DEEP RED)'
    },
    3: {
      id: 3,
      kf: 'K3',
      title: 'THE CORRIDOR',
      folder: 'clip 3 frame.zip',
      frameCount: 200,
      videoSrc: 'clip 3.mp4',
      staticFallback: 'k3.png',
      quote: '"Camera dropped near road surface, swung left to rear three-quarter while tracking alongside. Narrow canyon of dark glass skyscrapers reflecting the car\'s white and red light in long streaks."',
      specs: [
        'SPEED: 112 KM/H',
        'TORQUE: 1,220 NM',
        'CHASSIS ROLL: 0.0°',
        'AIR SUSPENSION: ACTIVE LOW'
      ],
      lightFront: 'ON (GLASS REFLECTION)',
      lightRear: 'ON (DEEP RED)'
    },
    4: {
      id: 4,
      kf: 'K4',
      title: 'THE OVERLOOK',
      folder: 'clip 3 frame.zip',
      frameCount: 200,
      videoSrc: 'clip 3.mp4',
      staticFallback: 'k4.png',
      quote: '"Perfect side profile, car facing right, camera at door-handle height on long elevated concrete bridge. Behind and below, the full dark skyline of the blacked-out city stretches as silhouettes against deep navy sky."',
      specs: [
        'SPEED: 140 KM/H',
        'TOP APEX: 340 KM/H CAP',
        'SKYLINE: SILHOUETTE',
        'AERO: 0.19 Cd'
      ],
      lightFront: 'ON (HORIZON SWEEP)',
      lightRear: 'ON (DEEP RED)'
    }
  };

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  let currentChapter = 1;
  let currentFrameIndex = 0;
  let isPlaying = false;
  let playAnimationId = null;
  let currentMode = 'canvas'; // 'canvas' or 'video'

  // Image Cache for Chapters
  const frameCaches = {
    1: new Map(),
    2: new Map(),
    3: new Map(),
    4: new Map()
  };

  // Exploded View Cache
  const explodedCache = new Map();
  const explodedFrameCount = 200;
  let currentExpFrame = 0;

  // Audio Synthesizer State
  let audioCtx = null;
  let droneOsc = null;
  let droneGain = null;
  let motorOsc = null;
  let motorGain = null;
  let isAudioEnabled = false;

  // DOM Elements - Hero Cinema
  const canvas = document.getElementById('cinema-canvas');
  const ctx = canvas.getContext('2d');
  const canvasLoader = document.getElementById('canvas-loader');
  const canvasLoaderText = document.getElementById('canvas-loader-text');
  const cinemaVideo = document.getElementById('cinema-video');
  const videoSource = document.getElementById('cinema-video-source');
  const canvasStageLayer = document.getElementById('canvas-stage-layer');
  const videoStageLayer = document.getElementById('video-stage-layer');
  const videoPlayOverlay = document.getElementById('video-play-overlay');
  const bigPlayBtn = document.getElementById('big-play-btn');

  // Controls & HUD Elements
  const modeCanvasBtn = document.getElementById('mode-canvas-btn');
  const modeVideoBtn = document.getElementById('mode-video-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const chapterTabs = document.querySelectorAll('.chapter-tab');
  const keyframeCards = document.querySelectorAll('.keyframe-card');
  const hudFrameNum = document.getElementById('hud-frame-num');
  const hudChapterInfo = document.getElementById('hud-chapter-info');
  const frameRangeSlider = document.getElementById('frame-range-slider');
  const scrubPlayBtn = document.getElementById('scrub-play-btn');
  const scrubPrevBtn = document.getElementById('scrub-prev-btn');
  const scrubNextBtn = document.getElementById('scrub-next-btn');
  const scrubPercent = document.getElementById('scrub-percent');
  const iconPlay = scrubPlayBtn.querySelector('.icon-play');
  const iconPause = scrubPlayBtn.querySelector('.icon-pause');

  // Exploded View Elements
  const expCanvas = document.getElementById('exploded-canvas');
  const expCtx = expCanvas.getContext('2d');
  const expRangeSlider = document.getElementById('exp-range-slider');
  const expTabScrub = document.getElementById('exp-tab-scrub');
  const expTabSplit = document.getElementById('exp-tab-split');
  const expScrubView = document.getElementById('exp-scrub-view');
  const expSplitView = document.getElementById('exp-split-view');
  const separationVal = document.getElementById('separation-val');
  const splitOverlay = document.getElementById('split-overlay');
  const splitDivider = document.getElementById('split-divider');

  // Master Sheet Elements
  const masterSheetImg = document.getElementById('master-sheet-img');
  const lightingOverlay = document.getElementById('lighting-overlay');
  const studioBtns = document.querySelectorAll('.studio-btn');

  // Sound & Allocation
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIconOff = soundToggleBtn.querySelector('.icon-off');
  const soundIconOn = soundToggleBtn.querySelector('.icon-on');
  const soundBtnText = soundToggleBtn.querySelector('.btn-text');
  const inquireBtn = document.getElementById('inquire-btn');
  const allocationModal = document.getElementById('allocation-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const copyPromptBtn = document.getElementById('copy-prompt-btn');

  // ==========================================================================
  // RETINA CANVAS SETUP
  // ==========================================================================
  function setupRetinaCanvas(targetCanvas, targetCtx) {
    const rect = targetCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    targetCanvas.width = 1280 * dpr;
    targetCanvas.height = 720 * dpr;
    targetCtx.scale(dpr, dpr);
  }

  setupRetinaCanvas(canvas, ctx);
  setupRetinaCanvas(expCanvas, expCtx);

  window.addEventListener('resize', () => {
    setupRetinaCanvas(canvas, ctx);
    setupRetinaCanvas(expCanvas, expCtx);
    renderCurrentFrame();
    renderExplodedFrame(currentExpFrame);
  });

  // ==========================================================================
  // ASSET LOADING UTILITIES
  // ==========================================================================
  function getFrameUrl(folder, index) {
    const padded = String(index).padStart(3, '0');
    // Using encodeURI to safely handle space in directory name
    return `${encodeURI(folder)}/ezgif-frame-${padded}.jpg`;
  }

  function getExplodedUrl(index) {
    const padded = String(index).padStart(3, '0');
    return `flow%20clip%20frame.zip/ezgif-frame-${padded}.jpg`;
  }

  /**
   * Preload a specific frame image. Returns a Promise resolving to the HTMLImageElement.
   */
  function preloadImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback or retry
        resolve(null);
      };
      img.src = url;
    });
  }

  /**
   * Progressive batch loader for the current chapter
   */
  async function loadChapterFrames(chapterId) {
    const ch = CHAPTERS[chapterId];
    const cache = frameCaches[chapterId];

    // Check if keyframe 001 is already cached
    if (cache.has(1)) {
      renderCurrentFrame();
      return;
    }

    canvasLoader.style.display = 'flex';
    canvasLoaderText.textContent = `LOADING TELEMETRY FRAMES (0%)`;

    // Always load the first frame immediately for instant display
    const firstUrl = getFrameUrl(ch.folder, 1);
    const firstImg = await preloadImage(firstUrl);
    if (firstImg) {
      cache.set(1, firstImg);
      renderCurrentFrame();
    } else {
      // Fallback to static keyframe
      const fallbackImg = await preloadImage(ch.staticFallback);
      if (fallbackImg) {
        cache.set(1, fallbackImg);
        renderCurrentFrame();
      }
    }

    // Load remaining frames in small batches so UI stays responsive
    const total = ch.frameCount;
    let loadedCount = 1;
    const batchSize = 12;

    for (let i = 2; i <= total; i += batchSize) {
      const batchPromises = [];
      for (let j = i; j < i + batchSize && j <= total; j++) {
        const frameIndex = j;
        batchPromises.push(
          preloadImage(getFrameUrl(ch.folder, frameIndex)).then((img) => {
            if (img) cache.set(frameIndex, img);
            loadedCount++;
          })
        );
      }
      await Promise.all(batchPromises);

      const percent = Math.round((loadedCount / total) * 100);
      canvasLoaderText.textContent = `BUFFERING TELEMETRY // ${percent}%`;
    }

    canvasLoader.style.display = 'none';
  }

  /**
   * Preload Exploded Sequence frames
   */
  async function loadExplodedFrames() {
    // Load first frame immediately
    const firstImg = await preloadImage(getExplodedUrl(1));
    if (firstImg) {
      explodedCache.set(1, firstImg);
      renderExplodedFrame(0);
    } else {
      // Fallback to e1.png
      const fallback = await preloadImage('e1.png');
      if (fallback) {
        explodedCache.set(1, fallback);
        renderExplodedFrame(0);
      }
    }

    // Background load the rest of the 200 frames
    for (let i = 2; i <= explodedFrameCount; i += 10) {
      const promises = [];
      for (let j = i; j < i + 10 && j <= explodedFrameCount; j++) {
        const idx = j;
        promises.push(
          preloadImage(getExplodedUrl(idx)).then((img) => {
            if (img) explodedCache.set(idx, img);
          })
        );
      }
      await Promise.all(promises);
    }
  }

  // ==========================================================================
  // HERO RENDERING & ANIMATION
  // ==========================================================================
  function renderCurrentFrame() {
    if (currentMode !== 'canvas') return;

    const ch = CHAPTERS[currentChapter];
    const cache = frameCaches[currentChapter];
    const targetIdx = currentFrameIndex + 1; // 1-based index (1 to 200)

    let imgToDraw = cache.get(targetIdx);

    // If target frame isn't loaded yet, pick the closest available frame
    if (!imgToDraw) {
      let closestDist = Infinity;
      let closestIdx = 1;
      for (let key of cache.keys()) {
        const dist = Math.abs(key - targetIdx);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = key;
        }
      }
      imgToDraw = cache.get(closestIdx);
    }

    if (imgToDraw) {
      ctx.clearRect(0, 0, 1280, 720);
      // Draw centered with cover fit
      ctx.drawImage(imgToDraw, 0, 0, 1280, 720);
    }

    // Update HUD
    updateHudDisplay();
  }

  function updateHudDisplay() {
    const ch = CHAPTERS[currentChapter];
    const currentNum = String(currentFrameIndex + 1).padStart(3, '0');
    const totalNum = String(ch.frameCount).padStart(3, '0');
    hudFrameNum.textContent = `FRM: ${currentNum} / ${totalNum}`;

    const percent = ((currentFrameIndex / (ch.frameCount - 1)) * 100).toFixed(1);
    scrubPercent.textContent = `${percent}%`;
    frameRangeSlider.value = currentFrameIndex;

    // Modulate synthesizer pitch if active
    if (isAudioEnabled && motorOsc) {
      const speedRatio = currentFrameIndex / ch.frameCount;
      motorOsc.frequency.setTargetAtTime(80 + speedRatio * 180, audioCtx.currentTime, 0.05);
    }
  }

  function setChapter(chapterId) {
    if (currentChapter === chapterId) return;
    currentChapter = chapterId;
    currentFrameIndex = 0;

    // Update Tab UI
    chapterTabs.forEach((tab) => {
      tab.classList.toggle('active', parseInt(tab.dataset.chapter) === chapterId);
    });

    // Update Keyframe card strip
    keyframeCards.forEach((card) => {
      card.classList.toggle('active', parseInt(card.dataset.ch) === chapterId);
    });

    // Update Card Info
    const ch = CHAPTERS[chapterId];
    hudChapterInfo.innerHTML = `
      <div class="ch-badge">CHAPTER 0${ch.id} // KEYFRAME ${ch.kf}</div>
      <h3 class="ch-card-title">${ch.title}</h3>
      <p class="ch-card-quote">${ch.quote}</p>
      <div class="ch-specs-row">
        ${ch.specs.map(s => `<span class="spec-pill">${s}</span>`).join('')}
      </div>
    `;

    // If in film/video mode, swap video source
    if (currentMode === 'video') {
      cinemaVideo.src = ch.videoSrc;
      cinemaVideo.currentTime = 0;
      cinemaVideo.play().catch(() => {});
      videoPlayOverlay.style.display = 'none';
    } else {
      loadChapterFrames(chapterId);
    }

    playUiClickSound();
  }

  // Playback Loop for Canvas Frame Scrubber
  function startPlayback() {
    if (isPlaying) return;
    isPlaying = true;
    scrubPlayBtn.classList.add('active');
    iconPlay.style.display = 'none';
    iconPause.style.display = 'block';

    let lastTime = performance.now();
    const fps = 30; // Standard cinematic 30fps playback
    const interval = 1000 / fps;

    function loop(now) {
      if (!isPlaying) return;
      const elapsed = now - lastTime;
      if (elapsed >= interval) {
        lastTime = now - (elapsed % interval);
        const ch = CHAPTERS[currentChapter];
        currentFrameIndex++;

        if (currentFrameIndex >= ch.frameCount) {
          // Auto advance to next chapter or loop
          if (currentChapter < 4) {
            setChapter(currentChapter + 1);
          } else {
            setChapter(1);
          }
        } else {
          renderCurrentFrame();
        }
      }
      playAnimationId = requestAnimationFrame(loop);
    }
    playAnimationId = requestAnimationFrame(loop);
  }

  function pausePlayback() {
    isPlaying = false;
    if (playAnimationId) cancelAnimationFrame(playAnimationId);
    scrubPlayBtn.classList.remove('active');
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
  }

  function togglePlayback() {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
    playUiClickSound();
  }

  // ==========================================================================
  // EXPLODED TECHNICAL VIEW (DECONSTRUCTION CONTROLLER)
  // ==========================================================================
  function renderExplodedFrame(frameIndex) {
    const targetIdx = frameIndex + 1; // 1 to 200
    let img = explodedCache.get(targetIdx);

    if (!img) {
      let closestDist = Infinity;
      let closestIdx = 1;
      for (let k of explodedCache.keys()) {
        const d = Math.abs(k - targetIdx);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = k;
        }
      }
      img = explodedCache.get(closestIdx);
    }

    if (img) {
      expCtx.clearRect(0, 0, 1280, 720);
      expCtx.drawImage(img, 0, 0, 1280, 720);
    }

    const pct = Math.round((frameIndex / (explodedFrameCount - 1)) * 100);
    separationVal.textContent = pct === 0 ? '0% (ASSEMBLED)' : pct === 100 ? '100% (FULL DECONSTRUCTION)' : `${pct}% EXPANDED`;
  }

  // ==========================================================================
  // WEB AUDIO PROCEDURAL SYNTHESIZER
  // ==========================================================================
  function initAudioEngine() {
    if (audioCtx) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();

      // Master Filter
      const lowpass = audioCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 320;
      lowpass.Q.value = 4;
      lowpass.connect(audioCtx.destination);

      // Sub-Bass Drone
      droneOsc = audioCtx.createOscillator();
      droneOsc.type = 'triangle';
      droneOsc.frequency.value = 52; // Warm low sub-bass

      droneGain = audioCtx.createGain();
      droneGain.gain.value = 0.08;

      droneOsc.connect(droneGain);
      droneGain.connect(lowpass);
      droneOsc.start();

      // Motor Frequency Harmonic (Modulates on scrub)
      motorOsc = audioCtx.createOscillator();
      motorOsc.type = 'sawtooth';
      motorOsc.frequency.value = 90;

      motorGain = audioCtx.createGain();
      motorGain.gain.value = 0.025;

      motorOsc.connect(motorGain);
      motorGain.connect(lowpass);
      motorOsc.start();

      // Subtle LFO Pitch Modulation
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.35; // 0.35 Hz breathing cycle
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 1.8;
      lfo.connect(lfoGain);
      lfoGain.connect(droneOsc.frequency);
      lfo.start();

    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  }

  function playUiClickSound() {
    if (!isAudioEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  function toggleAudio() {
    if (!isAudioEnabled) {
      initAudioEngine();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      isAudioEnabled = true;
      soundToggleBtn.classList.add('active');
      soundIconOff.style.display = 'none';
      soundIconOn.style.display = 'block';
      soundBtnText.textContent = 'SOUND: ACTIVE';
    } else {
      if (audioCtx) {
        audioCtx.suspend();
      }
      isAudioEnabled = false;
      soundToggleBtn.classList.remove('active');
      soundIconOff.style.display = 'block';
      soundIconOn.style.display = 'none';
      soundBtnText.textContent = 'SOUND: OFF';
    }
  }

  // ==========================================================================
  // EVENT LISTENERS & WIRING
  // ==========================================================================

  // Mode Switcher (Canvas vs Video)
  modeCanvasBtn.addEventListener('click', () => {
    currentMode = 'canvas';
    modeCanvasBtn.classList.add('active');
    modeVideoBtn.classList.remove('active');
    canvasStageLayer.style.display = 'block';
    videoStageLayer.style.display = 'none';
    cinemaVideo.pause();
    renderCurrentFrame();
    playUiClickSound();
  });

  modeVideoBtn.addEventListener('click', () => {
    currentMode = 'video';
    modeVideoBtn.classList.add('active');
    modeCanvasBtn.classList.remove('active');
    pausePlayback();
    canvasStageLayer.style.display = 'none';
    videoStageLayer.style.display = 'block';

    const ch = CHAPTERS[currentChapter];
    cinemaVideo.src = ch.videoSrc;
    cinemaVideo.play().catch(() => {
      videoPlayOverlay.style.display = 'flex';
    });
    playUiClickSound();
  });

  // Video big play overlay
  bigPlayBtn.addEventListener('click', () => {
    videoPlayOverlay.style.display = 'none';
    cinemaVideo.play();
  });

  cinemaVideo.addEventListener('ended', () => {
    // Advance video clip to next chapter
    if (currentChapter < 4) {
      setChapter(currentChapter + 1);
    } else {
      setChapter(1);
    }
  });

  cinemaVideo.addEventListener('play', () => {
    videoPlayOverlay.style.display = 'none';
  });

  cinemaVideo.addEventListener('pause', () => {
    videoPlayOverlay.style.display = 'flex';
  });

  // Fullscreen Theater
  fullscreenBtn.addEventListener('click', () => {
    const stage = document.getElementById('cinema-stage');
    if (!document.fullscreenElement) {
      stage.requestFullscreen?.() || stage.webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
    playUiClickSound();
  });

  // Chapter Navigation Tabs
  chapterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      pausePlayback();
      const chId = parseInt(tab.dataset.chapter);
      setChapter(chId);
    });
  });

  // Keyframe Filmstrip Click
  keyframeCards.forEach((card) => {
    card.addEventListener('click', () => {
      pausePlayback();
      const chId = parseInt(card.dataset.ch);
      setChapter(chId);
    });
  });

  // Scrubber Buttons
  scrubPlayBtn.addEventListener('click', togglePlayback);

  scrubPrevBtn.addEventListener('click', () => {
    pausePlayback();
    if (currentChapter > 1) {
      setChapter(currentChapter - 1);
    } else {
      setChapter(4);
    }
  });

  scrubNextBtn.addEventListener('click', () => {
    pausePlayback();
    if (currentChapter < 4) {
      setChapter(currentChapter + 1);
    } else {
      setChapter(1);
    }
  });

  // Slider Input
  frameRangeSlider.addEventListener('input', (e) => {
    pausePlayback();
    currentFrameIndex = parseInt(e.target.value);
    renderCurrentFrame();
  });

  // Canvas Mouse Drag Scrubbing
  let isDraggingCanvas = false;
  let dragStartX = 0;
  let dragStartFrame = 0;

  canvas.addEventListener('mousedown', (e) => {
    isDraggingCanvas = true;
    dragStartX = e.clientX;
    dragStartFrame = currentFrameIndex;
    pausePlayback();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingCanvas) return;
    const deltaX = e.clientX - dragStartX;
    const ch = CHAPTERS[currentChapter];
    const frameDelta = Math.round(deltaX / 4);
    let nextFrame = dragStartFrame + frameDelta;
    nextFrame = Math.max(0, Math.min(ch.frameCount - 1, nextFrame));
    currentFrameIndex = nextFrame;
    renderCurrentFrame();
  });

  window.addEventListener('mouseup', () => {
    isDraggingCanvas = false;
  });

  // Mouse Wheel Scrubbing over Stage
  const cinemaStage = document.getElementById('cinema-stage');
  cinemaStage.addEventListener('wheel', (e) => {
    if (currentMode !== 'canvas') return;
    e.preventDefault();
    pausePlayback();
    const ch = CHAPTERS[currentChapter];
    const delta = e.deltaY > 0 ? 2 : -2;
    let nextFrame = currentFrameIndex + delta;
    nextFrame = Math.max(0, Math.min(ch.frameCount - 1, nextFrame));
    currentFrameIndex = nextFrame;
    renderCurrentFrame();
  }, { passive: false });

  // Exploded View Slider
  expRangeSlider.addEventListener('input', (e) => {
    currentExpFrame = parseInt(e.target.value);
    renderExplodedFrame(currentExpFrame);
  });

  // Exploded Tabs (Scrub vs Split Curtain)
  expTabScrub.addEventListener('click', () => {
    expTabScrub.classList.add('active');
    expTabSplit.classList.remove('active');
    expScrubView.style.display = 'block';
    expSplitView.style.display = 'none';
    playUiClickSound();
  });

  expTabSplit.addEventListener('click', () => {
    expTabSplit.classList.add('active');
    expTabScrub.classList.remove('active');
    expScrubView.style.display = 'none';
    expSplitView.style.display = 'block';
    playUiClickSound();
  });

  // Draggable Split Curtain
  let isDraggingCurtain = false;
  const splitContainer = document.querySelector('.split-image-container');

  function updateCurtainPosition(clientX) {
    if (!splitContainer) return;
    const rect = splitContainer.getBoundingClientRect();
    let pos = ((clientX - rect.left) / rect.width) * 100;
    pos = Math.max(0, Math.min(100, pos));
    splitOverlay.style.width = `${pos}%`;
    splitDivider.style.left = `${pos}%`;
  }

  splitDivider.addEventListener('mousedown', () => {
    isDraggingCurtain = true;
  });

  splitContainer.addEventListener('click', (e) => {
    updateCurtainPosition(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingCurtain) return;
    updateCurtainPosition(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDraggingCurtain = false;
  });

  // Master Sheet Lighting Simulation Controls
  studioBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      studioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lightMode = btn.dataset.light;

      if (lightMode === 'default') {
        masterSheetImg.style.filter = 'none';
        lightingOverlay.style.background = 'transparent';
      } else if (lightMode === 'rim') {
        masterSheetImg.style.filter = 'contrast(1.3) brightness(1.1)';
        lightingOverlay.style.background = 'radial-gradient(ellipse at 50% 20%, rgba(226,241,255,0.2) 0%, transparent 70%)';
      } else if (lightMode === 'lasers') {
        masterSheetImg.style.filter = 'contrast(1.6) brightness(0.85)';
        lightingOverlay.style.background = 'radial-gradient(circle at 85% 70%, rgba(255,30,56,0.3) 0%, transparent 50%), radial-gradient(circle at 15% 30%, rgba(226,241,255,0.25) 0%, transparent 50%)';
      } else if (lightMode === 'monochrome') {
        masterSheetImg.style.filter = 'grayscale(1) contrast(1.7) brightness(0.9)';
        lightingOverlay.style.background = 'transparent';
      }
      playUiClickSound();
    });
  });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', toggleAudio);

  // Inquire / Allocation Modal
  inquireBtn.addEventListener('click', () => {
    allocationModal.style.display = 'flex';
    playUiClickSound();
  });

  modalCloseBtn.addEventListener('click', () => {
    allocationModal.style.display = 'none';
  });

  allocationModal.addEventListener('click', (e) => {
    if (e.target === allocationModal) {
      allocationModal.style.display = 'none';
    }
  });

  // Copy Build Prompt Button
  copyPromptBtn.addEventListener('click', async () => {
    const promptText = `# NOCTIS — Streamlined Production Integrator Specification
Base Lock: Electric Grand Tourer Coupe in Matte Graphite Grey (#07080A)
Keyframes: K1 (The Wake), K2 (The Departure), K3 (The Corridor), K4 (The Overlook)
Engineering: E1 (Assembled), E2 (Exploded Technical Deconstruction)
Media: Dual-mode canvas scrubber & 4K film video with 800V procedural audio synthesizer.`;

    try {
      await navigator.clipboard.writeText(promptText);
      const span = copyPromptBtn.querySelector('span');
      const original = span.textContent;
      span.textContent = 'COPIED TO CLIPBOARD!';
      setTimeout(() => span.textContent = original, 2000);
    } catch (e) {
      alert('Prompt specification is available in INTEGRATOR_PROMPT.md');
    }
    playUiClickSound();
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayback();
    } else if (e.code === 'ArrowLeft') {
      pausePlayback();
      currentFrameIndex = Math.max(0, currentFrameIndex - 10);
      renderCurrentFrame();
    } else if (e.code === 'ArrowRight') {
      pausePlayback();
      const ch = CHAPTERS[currentChapter];
      currentFrameIndex = Math.min(ch.frameCount - 1, currentFrameIndex + 10);
      renderCurrentFrame();
    } else if (e.code === 'Digit1') {
      setChapter(1);
    } else if (e.code === 'Digit2') {
      setChapter(2);
    } else if (e.code === 'Digit3') {
      setChapter(3);
    } else if (e.code === 'Digit4') {
      setChapter(4);
    } else if (e.key === 'm' || e.key === 'M') {
      toggleAudio();
    } else if (e.code === 'Escape') {
      allocationModal.style.display = 'none';
    }
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  loadChapterFrames(1);
  loadExplodedFrames();

});

