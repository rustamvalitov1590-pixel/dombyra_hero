'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Nurali3DViewerProps {
  className?: string;
  autoRotate?: boolean;
  enableControls?: boolean;
  onLoaded?: () => void;
}

export const Nurali3DViewer: React.FC<Nurali3DViewerProps> = ({
  className = 'w-full h-full min-h-[300px]',
  autoRotate = false,
  enableControls = true,
  onLoaded,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.25, 2.8);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Controls
    let controls: OrbitControls | null = null;
    if (enableControls) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(0, 0.9, 0);
      controls.minDistance = 1.2;
      controls.maxDistance = 5;
    }

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xfff1e6, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffd59e, 2.5);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x059669, 1.2);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 6. GLTF Model & Bones
    let model: THREE.Group | null = null;
    let headBone: THREE.Object3D | null = null;
    let neckBone: THREE.Object3D | null = null;
    let spineBone: THREE.Object3D | null = null;
    let rightForeArmBone: THREE.Object3D | null = null;
    let mouseX = 0;
    let mouseY = 0;

    const loader = new GLTFLoader();
    // Load new high-detail cartoon head model, fallback to rigged full body
    const modelPath = '/models/cartoon_head.glb';

    loader.load(
      modelPath,
      (gltf) => {
        model = gltf.scene;

        // Auto center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 1.6 / size.y;

        model.scale.set(scale, scale, scale);
        model.position.x = -center.x * scale;
        model.position.y = -box.min.y * scale;
        model.position.z = -center.z * scale;

        // Find skeleton bones for interactive head tracking & gestures (supports both naming standards)
        headBone = model.getObjectByName('head') || model.getObjectByName('mixamorig:Head') || null;
        neckBone = model.getObjectByName('neck_01') || model.getObjectByName('mixamorig:Neck') || null;
        spineBone = model.getObjectByName('spine_03') || model.getObjectByName('mixamorig:Spine1') || null;
        rightForeArmBone = model.getObjectByName('lowerarm_r') || model.getObjectByName('mixamorig:RightForeArm') || null;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
        setIsLoaded(true);
        if (onLoaded) onLoaded();
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error('Error loading 3D Nurali rigged model:', err);
        setError('Не удалось загрузить 3D модель');
      }
    );

    // 7. Mouse move for Head/Neck Tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
      mouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 8. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Idle breathing and gentle floating
      if (model) {
        model.position.y = -0.01 + Math.sin(elapsed * 2) * 0.015;

        // Interactive Head & Neck Rotation following mouse
        if (headBone && neckBone) {
          const targetY = mouseX * 0.65;
          const targetX = mouseY * 0.45;

          headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, targetY * 0.7, 0.1);
          headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, targetX * 0.6, 0.1);

          neckBone.rotation.y = THREE.MathUtils.lerp(neckBone.rotation.y, targetY * 0.3, 0.1);
          neckBone.rotation.x = THREE.MathUtils.lerp(neckBone.rotation.x, targetX * 0.3, 0.1);

          if (spineBone) {
            spineBone.rotation.y = THREE.MathUtils.lerp(spineBone.rotation.y, targetY * 0.15, 0.05);
          }
        } else if (!autoRotate) {
          // Fallback whole-model look-at if bones aren't present
          model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, mouseX * 0.4, 0.05);
        }

        // Alive hand gesture: subtle friendly waving of the raised hand
        if (rightForeArmBone) {
          rightForeArmBone.rotation.z = Math.sin(elapsed * 3) * 0.12;
        }

        if (autoRotate) {
          model.rotation.y += 0.008;
        }
      }

      if (controls) controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate, enableControls, onLoaded]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full" />

      {!isLoaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl gap-3 z-10">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-xs font-bold text-amber-300">
            3D Нұрәлі моделі жүктелуде... {loadingProgress}%
          </p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl p-4 text-xs text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
};

export default Nurali3DViewer;
