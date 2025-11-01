// Globe configuration constants
export const GLOBE_CONFIG = {
  // Entry limits - Now truly dynamic
  CONFIGURED_SPOTS: Number(process.env.NEXT_PUBLIC_WAITLIST_MAX_SPOTS || 1000),
  MIN_SPOTS: 200,
  MAX_SPOTS_LIMIT: 10000, // Increased to support scaling to 1000+

  // Circle sizing
  CIRCLE_SIZES: {
    mobile: {
      base: 18, // Increased from 14 to 18 for better mobile visibility
      min: 12, // Increased from 8 to 12 for better mobile visibility
      max: 26, // Increased from 20 to 26 for better mobile visibility
    },
    desktop: {
      base: 24,
      min: 12,
      max: 35,
    },
  },

  // Performance settings
  PERFORMANCE: {
    LOD_UPDATE_FREQUENCY_LOW: 4,
    LOD_UPDATE_FREQUENCY_HIGH: 6,
    BATCH_SIZE: 50,
    BATCH_DIVISOR: 10,
    MOBILE_FALLBACK: true, // Enable static fallback on mobile
    REDUCED_PARTICLES_MOBILE: 150, // Even fewer particles on mobile
  },

  // Camera settings
  CAMERA: {
    FOV: 60,
    NEAR: 1,
    FAR: 5000,
    MOBILE_DISTANCE: 1200,
    DESKTOP_DISTANCE: 800,
    ZOOM_MIN_MOBILE: 200, // Match desktop zoom limits for consistent experience
    ZOOM_MAX_MOBILE: 2000, // Match desktop zoom limits for consistent experience
    ZOOM_MIN_DESKTOP: 200,
    ZOOM_MAX_DESKTOP: 2000,
  },

  // Sphere settings
  SPHERE: {
    RADIUS: 300,
    CIRCLE_SEGMENTS: 24,
    REFERENCE_ENTRIES: 250,
  },

  // Interaction settings
  INTERACTION: {
    MOBILE_BREAKPOINT: 768,
    DRAG_THRESHOLD_MOBILE: 25,
    DRAG_THRESHOLD_DESKTOP: 15,
    CLICK_DEBOUNCE_TIME: 500,
    TOOLTIP_DURATION: 3000,
    AUTO_ROTATE_DELAY: 2000,
  },

  // Colors
  COLORS: ["#DE6635", "#8B4513", "#A0522D", "#CD853F", "#D2691E", "#B8860B"],

  // Starfield settings
  STARFIELD: {
    PARTICLE_COUNT: 300, // Reduced from 550 for better performance
    SKY_RADIUS: 2000,
    NUM_CLUSTERS: 12, // Reduced from 18
    CLUSTER_STAR_RATIO: 0.55,
  },
} as const;

// Calculate MAX_SPOTS with validation - Now truly dynamic
export const MAX_SPOTS = Math.max(
  GLOBE_CONFIG.MIN_SPOTS,
  Math.min(
    GLOBE_CONFIG.MAX_SPOTS_LIMIT,
    Number.isFinite(GLOBE_CONFIG.CONFIGURED_SPOTS)
      ? GLOBE_CONFIG.CONFIGURED_SPOTS
      : 1000
  )
);
