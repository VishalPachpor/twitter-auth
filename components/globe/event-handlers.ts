import * as THREE from "three";
import { GLOBE_CONFIG } from "./constants";
import { TooltipState, GlobeState } from "./types";

/**
 * Calculate touch distance for pinch gestures
 */
export const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Show tooltip with auto-hide for mobile
 */
export const showTooltipWithAutoHide = (
  content: string,
  x: number,
  y: number,
  duration: number,
  setTooltip: React.Dispatch<React.SetStateAction<TooltipState>>
) => {
  setTooltip({ visible: true, content, x, y });
  if (window.innerWidth <= 768) {
    setTimeout(
      () => setTooltip((prev) => ({ ...prev, visible: false })),
      duration
    );
  }
};

/**
 * Hide tooltip
 */
export const hideTooltip = (
  setTooltip: React.Dispatch<React.SetStateAction<TooltipState>>
) => {
  setTooltip((prev) => ({ ...prev, visible: false }));
};

/**
 * Handle mouse/touch down events
 */
export const createMouseDownHandler = (
  stateRef: { current: GlobeState },
  hideTooltipFn: () => void
) => {
  return (event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    hideTooltipFn();

    if ("touches" in event && event.touches.length > 1) {
      stateRef.current.isPinching = true;
      stateRef.current.touches = Array.from(event.touches);
      stateRef.current.lastPinchDistance = getTouchDistance(
        event.touches[0],
        event.touches[1]
      );
      stateRef.current.isAutoRotating = false;
      return;
    }

    stateRef.current.isMouseDown = true;
    stateRef.current.isDragging = false;
    stateRef.current.isPinching = false;
    stateRef.current.mouseDownTime = Date.now();
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;
    stateRef.current.mouseX = clientX;
    stateRef.current.mouseY = clientY;
    stateRef.current.startMouseX = clientX;
    stateRef.current.startMouseY = clientY;
  };
};

/**
 * Handle mouse/touch move events
 */
export const createMouseMoveHandler = (
  stateRef: { current: GlobeState },
  mouse: THREE.Vector2,
  renderer: THREE.WebGLRenderer,
  handleHover: () => void
) => {
  return (event: MouseEvent | TouchEvent) => {
    event.preventDefault();

    if (
      "touches" in event &&
      event.touches.length > 1 &&
      stateRef.current.isPinching
    ) {
      const currentDistance = getTouchDistance(
        event.touches[0],
        event.touches[1]
      );
      const distanceChange =
        currentDistance - stateRef.current.lastPinchDistance;

      if (Math.abs(distanceChange) > 2) {
        const zoomFactor = distanceChange > 0 ? 0.98 : 1.02;
        if (stateRef.current.camera) {
          stateRef.current.camera.position.multiplyScalar(zoomFactor);
          const mobile = window.innerWidth < 768;
          const minDistance = mobile
            ? GLOBE_CONFIG.CAMERA.ZOOM_MIN_MOBILE
            : GLOBE_CONFIG.CAMERA.ZOOM_MIN_DESKTOP;
          const maxDistance = mobile
            ? GLOBE_CONFIG.CAMERA.ZOOM_MAX_MOBILE
            : GLOBE_CONFIG.CAMERA.ZOOM_MAX_DESKTOP;
          stateRef.current.camera.position.clampLength(
            minDistance,
            maxDistance
          );
        }
        stateRef.current.lastPinchDistance = currentDistance;
      }
      return;
    }

    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    if (
      stateRef.current.isMouseDown &&
      !stateRef.current.isDragging &&
      !stateRef.current.isPinching
    ) {
      const deltaX = clientX - stateRef.current.startMouseX;
      const deltaY = clientY - stateRef.current.startMouseY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const dragThreshold = "touches" in event ? 25 : 15;
      if (distance > dragThreshold) {
        stateRef.current.isDragging = true;
        stateRef.current.isAutoRotating = false;
      }
    }

    if (stateRef.current.isDragging && !stateRef.current.isPinching) {
      const deltaX = clientX - stateRef.current.mouseX;
      const deltaY = clientY - stateRef.current.mouseY;
      const sensitivity = "touches" in event ? 0.008 : 0.005;
      stateRef.current.targetRotationY += deltaX * sensitivity;
      stateRef.current.targetRotationX += deltaY * sensitivity;
      stateRef.current.mouseX = clientX;
      stateRef.current.mouseY = clientY;
    } else if (!stateRef.current.isMouseDown && !stateRef.current.isPinching) {
      handleHover();
    }
  };
};

/**
 * Handle mouse/touch up events
 */
export const createMouseUpHandler = (
  stateRef: { current: GlobeState },
  handleMouseClick: () => void
) => {
  return (event: MouseEvent | TouchEvent) => {
    event.preventDefault();

    if ("touches" in event && stateRef.current.isPinching) {
      if (event.touches.length < 2) {
        stateRef.current.isPinching = false;
        stateRef.current.touches = [];
        setTimeout(() => {
          stateRef.current.isAutoRotating = true;
        }, 1000);
      }
      return;
    }

    const clientX =
      "changedTouches" in event
        ? event.changedTouches[0].clientX
        : (event as MouseEvent).clientX;
    const clientY =
      "changedTouches" in event
        ? event.changedTouches[0].clientY
        : (event as MouseEvent).clientY;
    const timeHeld = Date.now() - stateRef.current.mouseDownTime;
    const deltaX = clientX - stateRef.current.startMouseX;
    const deltaY = clientY - stateRef.current.startMouseY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const wasClick = timeHeld < 500 && distance < 30;

    if (
      wasClick &&
      stateRef.current.isMouseDown &&
      !stateRef.current.isPinching
    ) {
      handleMouseClick();
      if (!stateRef.current.isDragging) stateRef.current.isAutoRotating = true;
    } else if (stateRef.current.isDragging) {
      setTimeout(() => {
        stateRef.current.isAutoRotating = true;
      }, 2000);
    }

    stateRef.current.isMouseDown = false;
    stateRef.current.isDragging = false;
  };
};

/**
 * Handle wheel zoom events
 */
export const createWheelHandler = (stateRef: { current: GlobeState }) => {
  return (event: WheelEvent) => {
    event.preventDefault();
    if (!stateRef.current.camera) return;

    const sensitivity = window.devicePixelRatio > 1 ? 1.05 : 1.1;
    const delta = event.deltaY > 0 ? sensitivity : 1 / sensitivity;

    stateRef.current.camera.position.multiplyScalar(delta);
    const mobile = window.innerWidth < 768;
    const minDistance = mobile
      ? GLOBE_CONFIG.CAMERA.ZOOM_MIN_MOBILE
      : GLOBE_CONFIG.CAMERA.ZOOM_MIN_DESKTOP;
    const maxDistance = mobile
      ? GLOBE_CONFIG.CAMERA.ZOOM_MAX_MOBILE
      : GLOBE_CONFIG.CAMERA.ZOOM_MAX_DESKTOP;
    stateRef.current.camera.position.clampLength(minDistance, maxDistance);
  };
};

/**
 * Handle resize events
 */
export const createResizeHandler = (
  stateRef: { current: GlobeState },
  updateCircleSizes: (meshes: THREE.Mesh[], totalEntries: number) => void,
  MAX_SPOTS: number,
  isMobileDevice: () => boolean
) => {
  return () => {
    if (!stateRef.current.camera || !stateRef.current.renderer) return;
    stateRef.current.camera.aspect = window.innerWidth / window.innerHeight;
    stateRef.current.camera.updateProjectionMatrix();
    stateRef.current.renderer.setSize(window.innerWidth, window.innerHeight);
    updateCircleSizes(stateRef.current.profileMeshes, MAX_SPOTS);

    const mobile = isMobileDevice();
    const currentDistance = stateRef.current.camera.position.length();
    const targetDistance = mobile
      ? GLOBE_CONFIG.CAMERA.MOBILE_DISTANCE
      : GLOBE_CONFIG.CAMERA.DESKTOP_DISTANCE;
    if (Math.abs(currentDistance - targetDistance) > 100) {
      stateRef.current.camera.position
        .normalize()
        .multiplyScalar(targetDistance);
    }
  };
};
