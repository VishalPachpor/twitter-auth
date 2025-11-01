import * as THREE from "three";
import { GLOBE_CONFIG } from "./constants";
import {
  calculateCircleSize,
  generateRandomDirection,
  isMobileDevice,
} from "./utils";
import { GlobeState, ProfileData } from "./types";

/**
 * Create and configure the Three.js scene
 */
export const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x0a0a0a, 1000, 3000);
  return scene;
};

/**
 * Create and configure the camera
 */
export const createCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    GLOBE_CONFIG.CAMERA.FOV,
    window.innerWidth / window.innerHeight,
    GLOBE_CONFIG.CAMERA.NEAR,
    GLOBE_CONFIG.CAMERA.FAR
  );

  // Adjust camera distance based on screen size for better mobile visibility
  const mobile = isMobileDevice();
  camera.position.z = mobile
    ? GLOBE_CONFIG.CAMERA.MOBILE_DISTANCE
    : GLOBE_CONFIG.CAMERA.DESKTOP_DISTANCE;

  return camera;
};

/**
 * Create and configure the WebGL renderer
 */
export const createRenderer = (): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(window.devicePixelRatio);

  return renderer;
};

/**
 * Create profile meshes and add them to the globe group
 */
export const createProfileMeshes = (
  profileData: ProfileData[],
  maxSpots: number
): { globeGroup: THREE.Group; profileMeshes: THREE.Mesh[] } => {
  const globeGroup = new THREE.Group();
  const profileMeshes: THREE.Mesh[] = [];

  profileData.forEach((profile) => {
    // Calculate initial size based on total entries
    const mobile = isMobileDevice();
    const initialRadius = calculateCircleSize(maxSpots, mobile);
    const geometry = new THREE.CircleGeometry(
      initialRadius,
      GLOBE_CONFIG.SPHERE.CIRCLE_SEGMENTS
    );
    const material = new THREE.MeshBasicMaterial({
      color: profile.color,
      transparent: true,
      opacity: 1.0,
      depthWrite: true,
      side: THREE.DoubleSide,
    });

    const profileMesh = new THREE.Mesh(geometry, material);
    profileMesh.position.copy(profile.position);
    profileMesh.lookAt(0, 0, 0);
    profileMesh.userData = profile;

    globeGroup.add(profileMesh);
    profileMeshes.push(profileMesh);
  });

  return { globeGroup, profileMeshes };
};

/**
 * Create starfield particle system
 */
export const createStarfield = (): THREE.Points => {
  const { PARTICLE_COUNT, SKY_RADIUS, NUM_CLUSTERS, CLUSTER_STAR_RATIO } =
    GLOBE_CONFIG.STARFIELD;

  const pGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  const clusterCenters: Array<THREE.Vector3> = [];
  for (let c = 0; c < NUM_CLUSTERS; c++) {
    clusterCenters.push(generateRandomDirection());
  }

  const clusterStarsCount = Math.floor(PARTICLE_COUNT * CLUSTER_STAR_RATIO);

  const placeStar = (
    direction: THREE.Vector3,
    i: number,
    isCluster: boolean
  ) => {
    const idx = i * 3;
    positions[idx] = direction.x * SKY_RADIUS;
    positions[idx + 1] = direction.y * SKY_RADIUS;
    positions[idx + 2] = direction.z * SKY_RADIUS;

    const color = new THREE.Color();
    const hue = 0.06 + Math.random() * 0.12;
    const saturation = 0.35 + Math.random() * 0.35;
    const lightnessBase = isCluster ? 0.65 : 0.5;
    const lightness = lightnessBase + Math.random() * 0.25;
    color.setHSL(hue, saturation, Math.min(1, lightness));

    colors[idx] = color.r;
    colors[idx + 1] = color.g;
    colors[idx + 2] = color.b;
    sizes[i] = (isCluster ? 5 : 3) + Math.random() * (isCluster ? 5 : 4);
  };

  // Place cluster stars
  for (let i = 0; i < clusterStarsCount; i++) {
    const center = clusterCenters[i % NUM_CLUSTERS];
    const jitter = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    )
      .normalize()
      .multiplyScalar(0.25 * (0.5 + Math.random()));
    const direction = new THREE.Vector3().copy(center).add(jitter).normalize();
    placeStar(direction, i, true);
  }

  // Place background stars
  for (let i = clusterStarsCount; i < PARTICLE_COUNT; i++) {
    placeStar(generateRandomDirection(), i, false);
  }

  pGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  pGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const pMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0.0 } },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      void main() {
        vColor = color;
        vec3 drift = vec3(
          sin(time * 0.05 + position.y * 0.015) * 0.03,
          sin(time * 0.04 + position.z * 0.017) * 0.03,
          sin(time * 0.06 + position.x * 0.013) * 0.03
        );
        vec3 direction = normalize(position + drift);
        vec4 mvPosition = modelViewMatrix * vec4(direction * 2000.0, 1.0);
        gl_PointSize = size * (0.9 + 0.3 * sin(time * 0.8 + position.x * 0.01));
        gl_Position = projectionMatrix * mvPosition;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float distance = length(gl_PointCoord - vec2(0.5));
        float alpha = smoothstep(0.55, 0.0, distance);
        gl_FragColor = vec4(vColor, alpha * 1.0);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particleSystem = new THREE.Points(pGeometry, pMaterial);
  particleSystem.renderOrder = -1;

  return particleSystem;
};

/**
 * Update circle sizes based on screen size and total entries
 */
export const updateCircleSizes = (
  profileMeshes: THREE.Mesh[],
  totalEntries: number
): void => {
  const mobile = isMobileDevice();
  const newRadius = calculateCircleSize(totalEntries, mobile);

  profileMeshes.forEach((mesh) => {
    const geometry = mesh.geometry as THREE.CircleGeometry;
    if (geometry.parameters.radius !== newRadius) {
      // Dispose old geometry to prevent memory leaks
      geometry.dispose();
      // Create new geometry with updated radius
      const newGeometry = new THREE.CircleGeometry(
        newRadius,
        GLOBE_CONFIG.SPHERE.CIRCLE_SEGMENTS
      );
      mesh.geometry = newGeometry;
    }
  });
};
