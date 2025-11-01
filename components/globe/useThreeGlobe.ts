"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { WaitlistEntry } from "@/lib/waitlist-service";

// Import our modular components
import { MAX_SPOTS, GLOBE_CONFIG } from "./constants";
import {
  generateProfileData,
  calculateCircleSize,
  isMobileDevice,
} from "./utils";
import { createEmojiTexture, setTextureFromImage } from "./texture-helpers";
import { TooltipState, UseThreeGlobeOptions, GlobeState } from "./types";
import {
  createScene,
  createCamera,
  createRenderer,
  createProfileMeshes,
  createStarfield,
  updateCircleSizes,
} from "./scene-setup";
import {
  createMouseDownHandler,
  createMouseMoveHandler,
  createMouseUpHandler,
  createWheelHandler,
  createResizeHandler,
  hideTooltip,
  showTooltipWithAutoHide,
} from "./event-handlers";
import {
  createLODUpdater,
  createAnimationLoop,
  setupEventListeners,
  cleanupEventListeners,
} from "./animation-system";

export function useThreeGlobe(
  waitlistEntries: Map<number, WaitlistEntry>,
  {
    onEmptySpotClick,
    getEntryByProfileId,
    enabled = true,
  }: UseThreeGlobeOptions
) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store latest callbacks in refs to avoid re-initializing scene/effects
  const onEmptySpotClickRef = useRef(onEmptySpotClick);
  const getEntryByProfileIdRef = useRef(getEntryByProfileId);

  useEffect(() => {
    onEmptySpotClickRef.current = onEmptySpotClick;
    getEntryByProfileIdRef.current = getEntryByProfileId;
  }, [onEmptySpotClick, getEntryByProfileId]);

  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  const profileData = useMemo(() => generateProfileData(MAX_SPOTS), []);

  const stateRef = useRef<GlobeState>({
    isDragging: false,
    isMouseDown: false,
    isAutoRotating: true,
    rotationSpeed: 0.002,
    mouseX: 0,
    mouseY: 0,
    startMouseX: 0,
    startMouseY: 0,
    mouseDownTime: 0,
    targetRotationX: 0,
    targetRotationY: 0,
    currentRotationX: 0,
    currentRotationY: 0,
    particleSystem: null,
    globeGroup: null,
    camera: null,
    profileMeshes: [],
    renderer: null,
    scene: null,
    touches: [],
    lastPinchDistance: 0,
    isPinching: false,
    tooltipTimeoutId: null,
    lastTooltipTime: 0,
    lastClickTime: 0,
    lodFrame: 0,
  }).current;

  // Clear position visually
  const clearPositionVisually = useCallback(
    (profileId: number) => {
      const targetMesh = stateRef.profileMeshes.find(
        (mesh) => mesh.userData.id === profileId
      );
      if (!targetMesh) return;

      // Remove existing ring if present
      const existingRing = targetMesh.getObjectByName(
        "pfp-ring"
      ) as THREE.Mesh | null;
      if (existingRing) {
        targetMesh.remove(existingRing);
        existingRing.geometry.dispose();
        (existingRing.material as THREE.Material).dispose();
      }

      const originalProfile = profileData.find((p) => p.id === profileId);
      if (!originalProfile) return;

      const oldMaterial = targetMesh.material as THREE.MeshBasicMaterial;
      if (oldMaterial && oldMaterial.map) oldMaterial.map.dispose();

      targetMesh.material = new THREE.MeshBasicMaterial({
        color: originalProfile.color,
        transparent: true,
        opacity: 1.0,
        depthWrite: true,
        side: THREE.DoubleSide,
      });
      targetMesh.userData = { ...originalProfile };
    },
    [profileData]
  );

  // Apply entry to globe
  const applyEntryToGlobe = useCallback((entry: WaitlistEntry) => {
    const targetMesh = stateRef.profileMeshes.find(
      (mesh) => mesh.userData.id === entry.profileId
    );
    if (!targetMesh) return;

    const isHttpImage =
      typeof entry.avatar === "string" &&
      (entry.avatar.startsWith("https://") ||
        entry.avatar.startsWith("http://"));
    const isDataImage =
      typeof entry.avatar === "string" && entry.avatar.startsWith("data:");

    // Support DiceBear avatars when avatarType is 'avatar_seed'
    if (entry.avatarType === "avatar_seed") {
      const style =
        (entry.avatarStyle && entry.avatarStyle.trim()) || "adventurer";
      const seed =
        (entry.avatarSeed && entry.avatarSeed.toString()) ||
        entry.profileId.toString();
      const dicebearUrl = `https://api.dicebear.com/7.x/${encodeURIComponent(
        style
      )}/png?seed=${encodeURIComponent(seed)}&size=128&radius=50`;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setTextureFromImage(img, targetMesh);
      img.onerror = () => createEmojiTexture("🎭", targetMesh);
      img.src = dicebearUrl;
    } else if (isHttpImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setTextureFromImage(img, targetMesh);
      img.onerror = () => createEmojiTexture("🎭", targetMesh);
      img.src = entry.avatar;
    } else if (isDataImage) {
      const img = new Image();
      img.onload = () => setTextureFromImage(img, targetMesh);
      img.src = entry.avatar;
    } else {
      createEmojiTexture(entry.avatar || "😀", targetMesh);
    }

    targetMesh.userData = {
      ...targetMesh.userData,
      name: entry.name,
      isWaitlisted: true,
    };
  }, []);

  // Main effect - now much cleaner and shorter!
  useEffect(() => {
    if (!mountRef.current || !enabled) return;

    // Progress simulation
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // Initialize scene components
    setLoadingProgress(10);
    const scene = createScene();
    stateRef.scene = scene;

    setLoadingProgress(20);
    const camera = createCamera();
    stateRef.camera = camera;

    setLoadingProgress(40);
    const renderer = createRenderer();
    stateRef.renderer = renderer;
    mountRef.current.appendChild(renderer.domElement);

    setLoadingProgress(60);

    // Create profile meshes
    const { globeGroup, profileMeshes } = createProfileMeshes(
      profileData,
      MAX_SPOTS
    );
    stateRef.globeGroup = globeGroup;
    stateRef.profileMeshes = profileMeshes;
    scene.add(globeGroup);

    // Set initial circle sizes
    updateCircleSizes(profileMeshes, MAX_SPOTS);

    setLoadingProgress(80);

    // Create starfield
    const particleSystem = createStarfield();
    stateRef.particleSystem = particleSystem;
    scene.add(particleSystem);

    setLoadingProgress(90);

    // Setup interaction system
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    // Create event handlers
    const handleMouseDown = createMouseDownHandler({ current: stateRef }, () =>
      hideTooltip(setTooltip)
    );
    const handleMouseUp = createMouseUpHandler({ current: stateRef }, () => {
      if (!stateRef.camera) return;
      const now = Date.now();
      if (now - stateRef.lastClickTime < 500) return;
      stateRef.lastClickTime = now;

      raycaster.setFromCamera(mouse, stateRef.camera);
      const intersects = raycaster.intersectObjects(stateRef.profileMeshes);
      if (intersects.length > 0) {
        const profile = intersects[0].object.userData as { id: number };
        const entryData = getEntryByProfileIdRef.current(profile.id);
        if (entryData) {
          const display = entryData.name?.startsWith("@")
            ? entryData.name
            : entryData.name;
          showTooltipWithAutoHide(
            `<strong>${display}</strong><br>Waitlist Member`,
            (mouse.x * window.innerWidth) / 2 + window.innerWidth / 2 + 10,
            (-mouse.y * window.innerHeight) / 2 + window.innerHeight / 2 - 10,
            3000,
            setTooltip
          );
        } else {
          onEmptySpotClickRef.current(profile.id);
        }
      }
    });

    const handleHover = () => {
      if (!stateRef.camera) return;
      raycaster.setFromCamera(mouse, stateRef.camera);
      const intersects = raycaster.intersectObjects(stateRef.profileMeshes);
      if (intersects.length > 0) {
        const profile = intersects[0].object.userData as {
          id: number;
          color: string;
        };
        const entryData = getEntryByProfileIdRef.current(profile.id);
        const content = entryData
          ? (() => {
              // Extract username from name field (could be "@username" or "name")
              let username = entryData.name || "";
              // If name starts with @, use it as is, otherwise extract username if available
              if (!username.startsWith("@")) {
                // Try to extract username from name if it contains @
                const atIndex = username.indexOf("@");
                if (atIndex !== -1) {
                  username = username.substring(atIndex);
                } else {
                  // If no @ found, use the name as username
                  username = username;
                }
              }
              // Ensure username starts with @
              if (!username.startsWith("@") && username.trim()) {
                username = `@${username.trim()}`;
              }
              
              const hasImage =
                entryData.avatarType === "avatar_seed" ||
                (typeof entryData.avatar === "string" &&
                  (entryData.avatar.startsWith("https://") ||
                    entryData.avatar.startsWith("http://") ||
                    entryData.avatar.startsWith("data:")));
              const badge = hasImage
                ? ""
                : ' <span style="display:inline-block;margin-left:6px;padding:2px 6px;border-radius:8px;background:#475569;color:#e2e8f0;font-size:10px;vertical-align:middle;">No PFP</span>';
              return `<strong>${username}</strong>${badge}`;
            })()
          : `<strong>Available Spot</strong><br><span style="color: #f97316;">Click to join waitlist</span>`;

        if (window.innerWidth > 768) {
          setTooltip({
            visible: true,
            content,
            x: (mouse.x * window.innerWidth) / 2 + window.innerWidth / 2 + 10,
            y:
              (-mouse.y * window.innerHeight) / 2 + window.innerHeight / 2 - 10,
          });
        }
      } else {
        hideTooltip(setTooltip);
      }
    };

    const handleMouseMove = createMouseMoveHandler(
      { current: stateRef },
      mouse,
      renderer,
      handleHover
    );
    const handleWheel = createWheelHandler({ current: stateRef });
    const handleResize = createResizeHandler(
      { current: stateRef },
      updateCircleSizes,
      MAX_SPOTS,
      isMobileDevice
    );

    // Setup event listeners
    setupEventListeners(renderer, {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleWheel,
      handleResize,
    });

    // Setup animation system
    const updateLOD = createLODUpdater({ current: stateRef }, MAX_SPOTS);
    const animate = createAnimationLoop(
      { current: stateRef },
      mouse,
      updateLOD
    );
    animate(); // Start the animation loop

    setTimeout(() => {
      setLoadingProgress(100);
      setTimeout(() => {
        setLoading(false);
        clearInterval(progressInterval);
      }, 500);
    }, 300);

    // Cleanup function
    return () => {
      cleanupEventListeners(renderer, {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        handleResize,
      });

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Clean up Three.js objects
      if (stateRef.scene) {
        stateRef.scene.traverse((object: THREE.Object3D) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material: THREE.Material) =>
                material.dispose()
              );
            } else {
              (object.material as THREE.Material).dispose();
            }
          }
        });
      }
    };
  }, [profileData, enabled]);

  return {
    mountRef,
    loading,
    loadingProgress,
    tooltip,
    clearPositionVisually,
    applyEntryToGlobe,
  };
}
