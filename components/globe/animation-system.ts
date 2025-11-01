import * as THREE from "three";
import { MAX_SPOTS, GLOBE_CONFIG } from "./constants";
import { calculateCircleSize, isMobileDevice } from "./utils";
import { GlobeState } from "./types";

/**
 * Dynamic scaling system that maintains full sphere visibility
 */
export const createLODUpdater = (
  stateRef: { current: GlobeState },
  MAX_SPOTS: number
) => {
  return () => {
    if (!stateRef.current.camera || !stateRef.current.globeGroup) return;

    // Adjust update frequency based on total entries for better performance
    const updateFrequency = MAX_SPOTS > 500 ? 6 : 4;
    stateRef.current.lodFrame =
      (stateRef.current.lodFrame + 1) % updateFrequency;
    if (stateRef.current.lodFrame !== 0) return;

    const cameraDir = stateRef.current.camera.position.clone().normalize();
    const cameraDistance = stateRef.current.camera.position.length();

    // Calculate dynamic scale based on total entries and camera distance
    const mobile = isMobileDevice();
    const baseScale =
      calculateCircleSize(MAX_SPOTS, mobile) / (mobile ? 18 : 24);

    // Adjust scale based on camera distance for better visibility
    const distanceScale = Math.min(1.5, Math.max(0.8, cameraDistance / 1000));
    const finalScale = baseScale * distanceScale;

    // Update all meshes
    stateRef.current.profileMeshes.forEach((mesh) => {
      const normal = mesh.position.clone().normalize();
      const dot = normal.dot(cameraDir);

      // Keep all meshes visible to maintain full sphere shape
      mesh.visible = true;

      // Apply dynamic scaling
      mesh.scale.setScalar(finalScale);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        // Slightly reduce opacity for back-facing circles for depth perception
        const opacity = dot > 0 ? 1.0 : 0.8;
        mat.opacity = opacity;
        mat.transparent = true;
      }
    });
  };
};

/**
 * Create animation loop
 */
export const createAnimationLoop = (
  stateRef: { current: GlobeState },
  mouse: THREE.Vector2,
  updateLOD: () => void
) => {
  return () => {
    const animate = () => {
      requestAnimationFrame(animate);

      if (stateRef.current.isAutoRotating && !stateRef.current.isDragging) {
        stateRef.current.targetRotationY += stateRef.current.rotationSpeed;
      }

      if (stateRef.current.globeGroup) {
        stateRef.current.currentRotationX +=
          (stateRef.current.targetRotationX -
            stateRef.current.currentRotationX) *
          0.05;
        stateRef.current.currentRotationY +=
          (stateRef.current.targetRotationY -
            stateRef.current.currentRotationY) *
          0.05;
        stateRef.current.globeGroup.rotation.x =
          stateRef.current.currentRotationX;
        stateRef.current.globeGroup.rotation.y =
          stateRef.current.currentRotationY;
      }

      updateLOD();

      // Add floating motion to profile meshes (after LOD to avoid conflicts)
      const time = Date.now() * 0.001;
      stateRef.current.profileMeshes.forEach((mesh, index) => {
        // Create individual floating motion for each circle
        const floatSpeed = 0.8 + (index % 3) * 0.3; // Increased speed for more visible movement
        const floatAmplitude = 5 + (index % 2) * 2; // Increased amplitude for more visible movement
        const phase = (index * 0.1) % (Math.PI * 2); // Offset phase for each circle

        // Calculate floating offset
        const floatOffset =
          Math.sin(time * floatSpeed + phase) * floatAmplitude;

        // Apply floating motion to the mesh position
        const originalPosition =
          mesh.userData.originalPosition || mesh.position.clone();
        mesh.userData.originalPosition = originalPosition;

        // Move the mesh slightly outward and add floating motion
        const normalizedPos = originalPosition.clone().normalize();
        const newPosition = normalizedPos.multiplyScalar(
          GLOBE_CONFIG.SPHERE.RADIUS + floatOffset
        );
        mesh.position.copy(newPosition);
      });

      if (
        stateRef.current.particleSystem &&
        stateRef.current.globeGroup &&
        stateRef.current.camera
      ) {
        // @ts-expect-error uniforms typed loosely
        stateRef.current.particleSystem.material.uniforms.time.value =
          Date.now() * 0.001;
        const drift = Date.now() * 0.00002;
        stateRef.current.particleSystem.rotation.y =
          stateRef.current.globeGroup.rotation.y * 0.4 + drift;
        stateRef.current.particleSystem.rotation.x =
          stateRef.current.globeGroup.rotation.x * 0.4;

        const parallaxX = mouse.x * 40.0;
        const parallaxY = -mouse.y * 30.0;
        stateRef.current.camera.position.x +=
          (parallaxX - stateRef.current.camera.position.x) * 0.02;
        stateRef.current.camera.position.y +=
          (parallaxY - stateRef.current.camera.position.y) * 0.02;
        stateRef.current.camera.lookAt(0, 0, 0);
      }

      if (
        stateRef.current.renderer &&
        stateRef.current.scene &&
        stateRef.current.camera
      ) {
        stateRef.current.renderer.render(
          stateRef.current.scene,
          stateRef.current.camera
        );
      }
    };

    animate();
  };
};

/**
 * Setup event listeners
 */
export const setupEventListeners = (
  renderer: THREE.WebGLRenderer,
  handlers: {
    handleMouseDown: (event: MouseEvent | TouchEvent) => void;
    handleMouseMove: (event: MouseEvent | TouchEvent) => void;
    handleMouseUp: (event: MouseEvent | TouchEvent) => void;
    handleWheel: (event: WheelEvent) => void;
    handleResize: () => void;
  }
) => {
  renderer.domElement.addEventListener("mousedown", handlers.handleMouseDown);
  renderer.domElement.addEventListener("mousemove", handlers.handleMouseMove);
  renderer.domElement.addEventListener("mouseup", handlers.handleMouseUp);
  renderer.domElement.addEventListener("wheel", handlers.handleWheel, {
    passive: false,
  });
  renderer.domElement.addEventListener(
    "touchstart",
    handlers.handleMouseDown as any,
    {
      passive: false,
    }
  );
  renderer.domElement.addEventListener(
    "touchmove",
    handlers.handleMouseMove as any,
    {
      passive: false,
    }
  );
  renderer.domElement.addEventListener(
    "touchend",
    handlers.handleMouseUp as any,
    {
      passive: false,
    }
  );
  window.addEventListener("resize", handlers.handleResize);
};

/**
 * Cleanup event listeners
 */
export const cleanupEventListeners = (
  renderer: THREE.WebGLRenderer,
  handlers: {
    handleMouseDown: (event: MouseEvent | TouchEvent) => void;
    handleMouseMove: (event: MouseEvent | TouchEvent) => void;
    handleMouseUp: (event: MouseEvent | TouchEvent) => void;
    handleWheel: (event: WheelEvent) => void;
    handleResize: () => void;
  }
) => {
  window.removeEventListener("resize", handlers.handleResize);
  renderer.domElement.removeEventListener(
    "mousedown",
    handlers.handleMouseDown
  );
  renderer.domElement.removeEventListener(
    "mousemove",
    handlers.handleMouseMove
  );
  renderer.domElement.removeEventListener("mouseup", handlers.handleMouseUp);
  renderer.domElement.removeEventListener("wheel", handlers.handleWheel as any);
  renderer.domElement.removeEventListener(
    "touchstart",
    handlers.handleMouseDown as any
  );
  renderer.domElement.removeEventListener(
    "touchmove",
    handlers.handleMouseMove as any
  );
  renderer.domElement.removeEventListener(
    "touchend",
    handlers.handleMouseUp as any
  );
};
