import * as THREE from "three";
import { GLOBE_CONFIG } from "./constants";

/**
 * Calculate dynamic circle size based on total entries and device type
 */
export const calculateCircleSize = (
  totalEntries: number,
  isMobile: boolean = false
): number => {
  const config = isMobile
    ? GLOBE_CONFIG.CIRCLE_SIZES.mobile
    : GLOBE_CONFIG.CIRCLE_SIZES.desktop;

  // Calculate scaling factor based on entry count to maintain sphere shape
  const scaleFactor = Math.sqrt(
    GLOBE_CONFIG.SPHERE.REFERENCE_ENTRIES / totalEntries
  );
  const calculatedSize = config.base * scaleFactor;

  // Clamp between min and max sizes to ensure all circles remain visible
  return Math.max(config.min, Math.min(config.max, calculatedSize));
};

/**
 * Generate equidistant points on a sphere using the Fibonacci spiral
 */
export const generateSphericalDistribution = (
  count: number,
  radius: number
): THREE.Vector3[] => {
  const positions: THREE.Vector3[] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2; // Golden ratio for optimal distribution

  for (let i = 0; i < count; i++) {
    // Use Fibonacci spiral for optimal spherical distribution
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions.push(new THREE.Vector3(x, y, z));
  }

  return positions;
};

/**
 * Generate profile data with positions and colors
 */
export const generateProfileData = (count: number) => {
  const profileData = [] as Array<{
    id: number;
    name: string;
    role: string;
    color: string;
    position: THREE.Vector3;
  }>;

  // Generate equidistant positions on the sphere using Fibonacci spiral
  const positions = generateSphericalDistribution(
    count,
    GLOBE_CONFIG.SPHERE.RADIUS
  );

  for (let i = 1; i <= count; i++) {
    profileData.push({
      id: i,
      name: "",
      role: "Waitlist Spot",
      color: GLOBE_CONFIG.COLORS[i % GLOBE_CONFIG.COLORS.length],
      position: positions[i - 1], // Use pre-calculated equidistant position
    });
  }

  return profileData;
};

/**
 * Check if device is mobile based on screen width
 */
export const isMobileDevice = (): boolean => {
  return window.innerWidth < GLOBE_CONFIG.INTERACTION.MOBILE_BREAKPOINT;
};

/**
 * Calculate touch distance for pinch gestures
 */
export const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Generate random direction vector for starfield
 */
export const generateRandomDirection = (): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  );
};
