import * as THREE from "three";

/**
 * Create circular emoji texture on a mesh with optimized size
 */
export const createEmojiTexture = (emoji: string, mesh: THREE.Mesh): void => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const size = 128; // Reduced from 256 to 128 for better performance
  canvas.width = size;
  canvas.height = size;

  if (ctx) {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = mesh.userData.color;
    ctx.fill();
    ctx.font = `${size * 0.6}px "Noto Color Emoji", "Apple Color Emoji", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const oldMaterial = mesh.material as THREE.MeshBasicMaterial;
    if (oldMaterial && oldMaterial.map) oldMaterial.map.dispose();

    mesh.material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
      alphaTest: 0.5,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
  }
};

/**
 * Set texture from image on mesh with circular clipping and optimized size
 */
export const setTextureFromImage = (
  img: HTMLImageElement,
  mesh: THREE.Mesh
): void => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const size = 128; // Reduced from 256 to 128 for better performance
  canvas.width = size;
  canvas.height = size;

  if (ctx) {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const oldMaterial = mesh.material as THREE.MeshBasicMaterial;
    if (oldMaterial && oldMaterial.map) oldMaterial.map.dispose();

    mesh.material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
      alphaTest: 0.5,
      depthWrite: true,
      side: THREE.DoubleSide,
    });

    // Remove any existing ring
    const existingRing = mesh.getObjectByName("pfp-ring") as THREE.Mesh | null;
    if (existingRing) {
      mesh.remove(existingRing);
      existingRing.geometry.dispose();
      (existingRing.material as THREE.Material).dispose();
    }
  }
};
