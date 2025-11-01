import * as THREE from "three";
import { WaitlistEntry } from "@/lib/waitlist-service";

export type TooltipState = {
  visible: boolean;
  content: string;
  x: number;
  y: number;
};

export type UseThreeGlobeOptions = {
  onEmptySpotClick: (profileId: number) => void;
  getEntryByProfileId: (profileId: number) => WaitlistEntry | undefined;
  enabled?: boolean;
};

export type ProfileData = {
  id: number;
  name: string;
  role: string;
  color: string;
  position: THREE.Vector3;
};

export type GlobeState = {
  isDragging: boolean;
  isMouseDown: boolean;
  isAutoRotating: boolean;
  rotationSpeed: number;
  mouseX: number;
  mouseY: number;
  startMouseX: number;
  startMouseY: number;
  mouseDownTime: number;
  targetRotationX: number;
  targetRotationY: number;
  currentRotationX: number;
  currentRotationY: number;
  particleSystem: THREE.Points | null;
  globeGroup: THREE.Group | null;
  camera: THREE.PerspectiveCamera | null;
  profileMeshes: THREE.Mesh[];
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  // Touch/pinch gesture state
  touches: Touch[];
  lastPinchDistance: number;
  isPinching: boolean;
  // Mobile tooltip management
  tooltipTimeoutId: NodeJS.Timeout | null;
  lastTooltipTime: number;
  // Click debounce for mobile
  lastClickTime: number;
  lodFrame: number;
};
