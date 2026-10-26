import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ThreePlanetProps {
  className?: string;
  onExploreZones?: () => void;
  onEnterPlanetX?: () => void;
}

// Helper to generate high-resolution procedural cosmic planet texture (Zero external asset dependencies)
function createPlanetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep cosmic background gradient
  const grad = ctx.createLinearGradient(0, 0, 1024, 512);
  grad.addColorStop(0, '#040714');
  grad.addColorStop(0.25, '#091332');
  grad.addColorStop(0.5, '#0e224e');
  grad.addColorStop(0.75, '#141738');
  grad.addColorStop(1, '#050917');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Continental landmasses
  ctx.fillStyle = '#0a2352';
  for (let i = 0; i < 45; i++) {
    const cx = Math.random() * 1024;
    const cy = Math.random() * 512;
    const r = 30 + Math.random() * 85;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glowing electric cyan fissures / tech grid lines
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.8;
  ctx.globalAlpha = 0.65;
  for (let i = 0; i < 24; i++) {
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 1024; x += 50) {
      ctx.lineTo(x, y + Math.sin(x * 0.035) * 16 + (Math.random() * 6 - 3));
    }
    ctx.stroke();
  }

  // Glowing energy hubs (violet & magenta)
  ctx.fillStyle = '#c084fc';
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 50; i++) {
    const nx = Math.random() * 1024;
    const ny = Math.random() * 512;
    ctx.beginPath();
    ctx.arc(nx, ny, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1.0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Procedural orbital ring texture
function createRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
  grad.addColorStop(0.15, 'rgba(6, 182, 212, 0.7)');
  grad.addColorStop(0.4, 'rgba(139, 92, 246, 0.95)');
  grad.addColorStop(0.7, 'rgba(236, 72, 153, 0.65)');
  grad.addColorStop(0.9, 'rgba(56, 189, 248, 0.3)');
  grad.addColorStop(1, 'rgba(6, 182, 212, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Inner Planet Component managed inside React Three Fiber
interface PlanetSceneProps {
  speed: number;
  showRings: boolean;
}

const PlanetScene: React.FC<PlanetSceneProps> = ({ speed, showRings }) => {
  const planetGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Generate procedural textures once
  const planetTexture = useMemo(() => createPlanetTexture(), []);
  const ringTexture = useMemo(() => createRingTexture(), []);

  // Generate orbital particles
  const [particlePositions, particleColors] = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.9 + Math.random() * 0.9;
      const yOffset = (Math.random() - 0.5) * 0.12;

      // Match ring tilt
      const tiltedY = yOffset * Math.cos(Math.PI / 2.3) - Math.sin(angle) * radius * Math.sin(0.4);
      const tiltedZ = Math.sin(angle) * radius * Math.cos(0.4);

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = tiltedY;
      positions[i * 3 + 2] = tiltedZ;

      if (Math.random() > 0.45) {
        colors[i * 3] = 0.02;     // Cyan R
        colors[i * 3 + 1] = 0.71; // Cyan G
        colors[i * 3 + 2] = 0.83; // Cyan B
      } else {
        colors[i * 3] = 0.92;     // Magenta R
        colors[i * 3 + 1] = 0.28; // Magenta G
        colors[i * 3 + 2] = 0.6;  // Magenta B
      }
    }
    return [positions, colors];
  }, []);

  // Frame loop for continuous rotation & smooth mouse responsiveness
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);

    // Continuous spin
    if (coreRef.current) {
      coreRef.current.rotation.y += dt * 0.28 * speed;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += dt * 0.35 * speed;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= dt * 0.09 * speed;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += dt * 0.07 * speed;
    }

    // Mouse responsiveness with frame-rate independent exponential damping
    if (planetGroupRef.current) {
      const targetRotY = state.pointer.x * 0.45;
      const targetRotX = -state.pointer.y * 0.35 + 0.15;
      const targetPosX = state.pointer.x * 0.25;
      const targetPosY = state.pointer.y * 0.15;

      planetGroupRef.current.rotation.y = THREE.MathUtils.damp(
        planetGroupRef.current.rotation.y,
        targetRotY,
        3.5,
        dt
      );
      planetGroupRef.current.rotation.x = THREE.MathUtils.damp(
        planetGroupRef.current.rotation.x,
        targetRotX,
        3.5,
        dt
      );
      planetGroupRef.current.position.x = THREE.MathUtils.damp(
        planetGroupRef.current.position.x,
        targetPosX,
        3.5,
        dt
      );
      planetGroupRef.current.position.y = THREE.MathUtils.damp(
        planetGroupRef.current.position.y,
        targetPosY,
        3.5,
        dt
      );
    }
  });

  return (
    <>
      {/* Studio Lighting Rig */}
      <ambientLight color="#0e172e" intensity={1.2} />
      <directionalLight position={[5, 3, 5]} color="#38bdf8" intensity={2.6} />
      <directionalLight position={[-6, -2, -4]} color="#8b5cf6" intensity={3.2} />
      <pointLight position={[2, -4, 3]} color="#ec4899" intensity={1.8} distance={15} />

      {/* Main Celestial Group */}
      <group ref={planetGroupRef} rotation={[0.15, 0, 0.22]}>
        {/* 1. Core Planet */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[1.4, 64, 64]} />
          <meshStandardMaterial
            map={planetTexture}
            roughness={0.35}
            metalness={0.25}
          />
        </mesh>

        {/* 2. Atmospheric Fresnel Halo */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[1.45, 36, 36]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.2}
            roughness={0.1}
            metalness={0.1}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 3. Tilted Holographic Orbital Ring */}
        {showRings && (
          <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
            <ringGeometry args={[1.85, 2.7, 80]} />
            <meshBasicMaterial
              map={ringTexture}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* 4. Cosmic Particle Dust System */}
        {showRings && (
          <points ref={particlesRef}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[particlePositions, 3]}
              />
              <bufferAttribute
                attach="attributes-color"
                args={[particleColors, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.032}
              vertexColors
              transparent
              opacity={0.75}
              depthWrite={false}
            />
          </points>
        )}
      </group>
    </>
  );
};

class CanvasErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('WebGL rendering fallback active:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const ThreePlanet: React.FC<ThreePlanetProps> = ({
  className = '',
  onExploreZones,
  onEnterPlanetX
}) => {
  const rotationSpeed = 1;
  const ringsVisible = true;
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

  // Check WebGL availability once
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setWebGlSupported(false);
      }
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  const fallbackVisual = (
    <div className="w-full h-full flex items-center justify-center p-6 bg-radial from-cyan-950/40 to-slate-950">
      <div className="relative w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-900 via-blue-800 to-fuchsia-900 border border-cyan-400/30 shadow-[0_0_80px_rgba(6,182,212,0.3)] flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-fuchsia-500/30 scale-125 rotate-45" />
        <div className="text-center p-4">
          <span className="text-xs uppercase font-mono tracking-widest text-cyan-400">PLANET-X 2026</span>
          <p className="text-sm font-semibold text-white mt-1">Procedural Core Matrix</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      {/* 3D Scene Viewport rendered with React Three Fiber with Error Boundary */}
      <div className="w-full h-[460px] md:h-[620px] lg:h-[720px] cursor-grab active:cursor-grabbing">
        {webGlSupported ? (
          <CanvasErrorBoundary fallback={fallbackVisual}>
            <Canvas
              camera={{ position: [0, 0.4, 4.8], fov: 45 }}
              dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1]}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
              }}
            >
              <Suspense fallback={null}>
                <PlanetScene speed={rotationSpeed} showRings={ringsVisible} />
              </Suspense>
            </Canvas>
          </CanvasErrorBoundary>
        ) : (
          fallbackVisual
        )}
      </div>

      {/* Hero Overlay Text Layer (Semantic DOM overlay) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-12 lg:p-16 z-10">
        {/* Top Kicker & Institution */}
        <div className="max-w-4xl mx-auto text-center pt-2">
          <div className="text-xs sm:text-sm font-mono tracking-[0.25em] text-cyan-400 uppercase mb-3 drop-shadow-md">
            SVKM'S NMIMS GLOBAL UNIVERSITY, DHULE PRESENTS
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white uppercase drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
            PLANET-X <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">2026</span>
          </h1>
          <p className="mt-2 sm:mt-3 text-base sm:text-xl md:text-2xl font-medium tracking-wide text-slate-200">
            BEYOND INNOVATION. BEYOND LIMITS.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-slate-300">
            <span>3 ZONES</span>
            <span aria-hidden="true" className="text-cyan-500">/</span>
            <span>8 COMPETITIONS</span>
            <span aria-hidden="true" className="text-cyan-500">/</span>
            <span className="text-cyan-300">₹50,000 PRIZE POOL</span>
          </div>
        </div>

        {/* Center/Bottom CTA Buttons */}
        <div className="max-w-md mx-auto w-full pointer-events-auto flex flex-col sm:flex-row items-center justify-center gap-4 pb-12 sm:pb-16">
          <button
            onClick={onEnterPlanetX}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
          >
            ENTER PLANET-X
          </button>
          <button
            onClick={onExploreZones}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 transition-all backdrop-blur-md whitespace-nowrap"
          >
            EXPLORE THE ZONES
          </button>
        </div>
      </div>
    </div>
  );
};
