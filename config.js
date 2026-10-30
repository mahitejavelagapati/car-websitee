/**
 * NOCTIS — Configuration & Design System Settings
 * Tune section heights, frame counts, asset paths, chapters, and callout coordinates.
 */

const CONFIG = {
  // Pinned Section Heights (CSS viewport units)
  heroHeight: '600vh',
  dismantleHeight: '350vh',

  // Frame Counts (Real counts prepared from assets)
  heroFrameCount: 599,
  dismantleFrameCount: 200,

  // Asset Path Templates ({index} replaced with 4-digit padded number: 0001)
  paths: {
    heroDesktop: 'assets/frames/hero/frame_{index}.webp',
    heroMobile: 'assets/frames/hero-mobile/frame_{index}.webp',
    dismantleDesktop: 'assets/frames/dismantle/frame_{index}.webp',
    dismantleMobile: 'assets/frames/dismantle-mobile/frame_{index}.webp',
    carsDir: 'assets/cars/'
  },

  // Hero Scrollytelling Chapters (progress ranges 0.00 to 1.00)
  heroChapters: [
    {
      id: 1,
      range: [0.00, 0.15],
      headline: 'NOCTIS',
      subline: 'The city is asleep.',
      hint: 'SCROLL TO WAKE IT',
      hudChapter: '01/04'
    },
    {
      id: 2,
      range: [0.22, 0.40],
      headline: "It doesn't need the city's light.",
      subline: '',
      hint: '',
      hudChapter: '02/04'
    },
    {
      id: 3,
      range: [0.50, 0.68],
      headline: 'It brings its own.',
      subline: '',
      hint: '',
      hudChapter: '03/04'
    },
    {
      id: 4,
      range: [0.80, 1.00],
      headline: 'GT-E',
      subline: '0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR',
      cta: 'Discover the GT-E',
      ctaHref: '#lineup',
      hudChapter: '04/04'
    }
  ],

  // Hero Telemetry HUD calibration
  heroTelemetry: {
    maxSpeed: 118,      // KM/H at progress 1.0
    maxDistance: 4.2,   // KM at progress 1.0
    fadeToBlackStart: 0.95 // Last 5% fades to solid black
  },

  // Dismantle Technical Callouts (appear after 70% progress)
  // x/y are percentage coordinates [0..100] on the 1600x900 canvas
  dismantleCallouts: [
    {
      id: 'body',
      revealAt: 0.72,
      title: 'BODY',
      desc: 'Carbon composite monocoque',
      pin: { x: 48, y: 28 },
      labelPos: { x: 58, y: 20 },
      lineDir: 'top-right'
    },
    {
      id: 'light',
      revealAt: 0.78,
      title: 'LIGHT',
      desc: 'Single-line LED signature',
      pin: { x: 24, y: 48 },
      labelPos: { x: 14, y: 40 },
      lineDir: 'top-left'
    },
    {
      id: 'drive',
      revealAt: 0.85,
      title: 'DRIVE',
      desc: 'Dual axial-flux motors, 680 kW',
      pin: { x: 74, y: 60 },
      labelPos: { x: 78, y: 52 },
      lineDir: 'top-right'
    },
    {
      id: 'battery',
      revealAt: 0.92,
      title: 'BATTERY',
      desc: '110 kWh structural pack',
      pin: { x: 52, y: 72 },
      labelPos: { x: 58, y: 82 },
      lineDir: 'bottom-right'
    }
  ],

  // Lineup Models Data
  lineupModels: [
    {
      id: 'gte',
      index: '01',
      name: 'GT-E',
      tagline: 'The grand tourer.',
      specs: {
        range: '640 km',
        acceleration: '3.1 s',
        power: '680 kW'
      },
      image: 'assets/cars/gt-e.webp',
      alt: 'NOCTIS GT-E side profile in matte graphite',
      colors: ['#121418', '#EDEAE4', '#1A2430', '#7A1412']
    },
    {
      id: 's',
      index: '02',
      name: 'S',
      tagline: 'Four doors, no compromise.',
      specs: {
        range: '600 km',
        acceleration: '3.6 s',
        power: '520 kW'
      },
      image: 'assets/cars/s.webp',
      alt: 'NOCTIS S sport sedan side profile in satin bone white',
      colors: ['#EDEAE4', '#121418', '#2C3238', '#1C2630']
    },
    {
      id: 'x',
      index: '03',
      name: 'X',
      tagline: 'Higher, never heavier.',
      specs: {
        range: '560 km',
        acceleration: '4.2 s',
        power: '480 kW'
      },
      image: 'assets/cars/x.webp',
      alt: 'NOCTIS X coupe SUV side profile in midnight blue',
      colors: ['#182A3A', '#121418', '#EDEAE4', '#3E4650']
    },
    {
      id: 'r',
      index: '04',
      name: 'R',
      tagline: 'Built for the track.',
      specs: {
        range: '420 km',
        acceleration: '2.4 s',
        power: '900 kW'
      },
      image: 'assets/cars/r.webp',
      alt: 'NOCTIS R track coupe side profile in satin black with red accents',
      colors: ['#0E1012', '#E1251B', '#3E4650', '#EDEAE4']
    },
    {
      id: 'one',
      index: '05',
      name: 'ONE',
      tagline: 'The future, early.',
      specs: {
        range: 'Concept',
        acceleration: 'Sub-2.0 s',
        power: 'Solid State'
      },
      image: 'assets/cars/one.webp',
      alt: 'NOCTIS ONE hypercar concept side profile in liquid silver',
      colors: ['#C8D2DC', '#121418', '#202428', '#8A8F98']
    }
  ],

  // Animation & Rendering Tuning
  rendering: {
    mobileBreakpoint: 768,
    canvasDprCap: 2,
    lerpFactor: 0.15,
    cursorLerp: 0.18,
    preloadHeroInitial: 40, // Frames loaded before revealing preloader
    accordionDebounceMs: 80
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
