import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GlobalSettings } from '../types.ts';

interface ThreePlanetProps {
  className?: string;
  settings?: GlobalSettings;
  totalEventsCount?: number;
  totalZonesCount?: number;
  onExploreZones?: () => void;
  onEnterPlanetX?: () => void;
}

// Procedural sleek tech circuit texture for the streamlined celestial core
function createPlanetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep obsidian & cosmic nebula gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  bgGrad.addColorStop(0, '#02040c');
  bgGrad.addColorStop(0.25, '#050c20');
  bgGrad.addColorStop(0.5, '#091533');
  bgGrad.addColorStop(0.75, '#050c20');
  bgGrad.addColorStop(1, '#020309');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Soft continental tech dark patches
  ctx.fillStyle = '#071638';
  for (let i = 0; i < 30; i++) {
    const cx = Math.random() * 2048;
    const cy = Math.random() * 1024;
    const rw = 70 + Math.random() * 140;
    const rh = 35 + Math.random() * 70;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Delicate equatorial digital circuit waves
  const waveCount = 14;
  for (let w = 0; w < waveCount; w++) {
    const baseY = 320 + w * 28 + Math.sin(w * 0.9) * 16;
    const waveFreq = 0.007 + (w % 3) * 0.003;
    const waveAmp = 22 + (w % 4) * 9;

    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = w % 2 === 0 ? '#38bdf8' : '#00e5ff';
    ctx.lineWidth = w % 3 === 0 ? 2.4 : 1.5;
    ctx.globalAlpha = 0.88;

    ctx.beginPath();
    ctx.moveTo(0, baseY);

    for (let x = 0; x <= 2048; x += 32) {
      const rawSin = Math.sin(x * waveFreq) * waveAmp;
      const stepped = Math.round(rawSin / 6) * 6;
      const curY = baseY + stepped;
      ctx.lineTo(x, curY);

      if (x % 160 === 0 && Math.random() > 0.45) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, curY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.stroke();
  }

  // Refined longitudinal coordinate lines
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#818cf8';
  ctx.strokeStyle = '#4338ca';
  ctx.lineWidth = 0.9;
  ctx.globalAlpha = 0.45;
  for (let lon = 0; lon < 2048; lon += 170) {
    ctx.beginPath();
    ctx.moveTo(lon, 0);
    ctx.lineTo(lon, 1024);
    ctx.stroke();
  }

  // Subtle latitudinal pulse rings
  for (let lat = 140; lat < 900; lat += 120) {
    ctx.beginPath();
    ctx.moveTo(0, lat);
    ctx.lineTo(2048, lat);
    ctx.stroke();
  }

  // Glowing micro data nodes
  ctx.shadowBlur = 10;
  for (let p = 0; p < 90; p++) {
    const px = Math.random() * 2048;
    const py = Math.random() * 1024;
    ctx.shadowColor = p % 2 === 0 ? '#38bdf8' : '#d946ef';
    ctx.fillStyle = p % 2 === 0 ? '#7dd3fc' : '#f472b6';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(px, py, 1.8 + Math.random() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Procedural luminous magenta / purple cosmic energy ring texture
function createRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, 'rgba(217, 70, 239, 0)');
  grad.addColorStop(0.1, 'rgba(168, 85, 247, 0.25)');
  grad.addColorStop(0.24, 'rgba(217, 70, 239, 0.75)');
  grad.addColorStop(0.48, 'rgba(244, 114, 182, 0.95)');
  grad.addColorStop(0.65, 'rgba(217, 70, 239, 0.9)');
  grad.addColorStop(0.82, 'rgba(147, 51, 234, 0.6)');
  grad.addColorStop(0.94, 'rgba(56, 189, 248, 0.2)');
  grad.addColorStop(1, 'rgba(217, 70, 239, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface PlanetSceneProps {
  speed: number;
}

const PlanetScene: React.FC<PlanetSceneProps> = ({ speed }) => {
  const planetGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const geodesicRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const secondaryRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const planetTexture = useMemo(() => createPlanetTexture(), []);
  const ringTexture = useMemo(() => createRingTexture(), []);

  // Geodesic wireframe geometry: clean, lightweight icosahedron with fine tessellation
  const geodesicGeo = useMemo(() => new THREE.IcosahedronGeometry(1.42, 3), []);

  // Fine stardust & cosmic particle distribution
  const [particlePositions, particleColors] = useMemo(() => {
    const count = 480;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const isOrbitalRing = i < 340;
      let x = 0;
      let y = 0;
      let z = 0;

      if (isOrbitalRing) {
        // Concentrated in the tilted orbital disc
        const angle = (i / 340) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const radius = 1.6 + Math.random() * 1.5;
        const ySpread = (Math.random() - 0.5) * 0.5;

        const ringTiltX = 1.32;
        const rawX = Math.cos(angle) * radius;
        const rawZ = Math.sin(angle) * radius;

        x = rawX;
        y = -rawZ * Math.sin(ringTiltX) + ySpread;
        z = rawZ * Math.cos(ringTiltX);
      } else {
        // Floating atmospheric stardust envelope
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        const r = 1.48 + Math.random() * 0.7;

        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const colorPick = Math.random();
      if (colorPick < 0.45) {
        // Radiant cyan
        colors[i * 3] = 0.05;
        colors[i * 3 + 1] = 0.88;
        colors[i * 3 + 2] = 0.98;
      } else if (colorPick < 0.8) {
        // Vivid fuchsia / magenta
        colors[i * 3] = 0.92;
        colors[i * 3 + 1] = 0.32;
        colors[i * 3 + 2] = 0.92;
      } else {
        // Star white / lavender
        colors[i * 3] = 0.9;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 1.0;
      }
    }
    return [positions, colors];
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);

    // Continuous smooth planetary rotation
    if (coreRef.current) {
      coreRef.current.rotation.y += dt * 0.18 * speed;
    }

    // Delicate geodesic wireframe overlay rotates with elegant independent counter-drift
    if (geodesicRef.current) {
      geodesicRef.current.rotation.y += dt * 0.08 * speed;
      geodesicRef.current.rotation.x += dt * 0.03 * speed;
    }

    // Radiant energy rings rotation
    if (ringRef.current) {
      ringRef.current.rotation.z -= dt * 0.045 * speed;
    }
    if (secondaryRingRef.current) {
      secondaryRingRef.current.rotation.z += dt * 0.03 * speed;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= dt * 0.06 * speed;
    }

    // Orbital dust slow orbit
    if (particlesRef.current) {
      particlesRef.current.rotation.y += dt * 0.035 * speed;
    }

    // Subtle fluid pointer parallax
    if (planetGroupRef.current) {
      const targetRotY = state.pointer.x * 0.22;
      const targetRotX = -state.pointer.y * 0.15 + 0.04;

      planetGroupRef.current.rotation.y = THREE.MathUtils.damp(
        planetGroupRef.current.rotation.y,
        targetRotY,
        3.0,
        dt
      );
      planetGroupRef.current.rotation.x = THREE.MathUtils.damp(
        planetGroupRef.current.rotation.x,
        targetRotX,
        3.0,
        dt
      );
    }
  });

  return (
    <>
      {/* Cinematic Studio Lighting */}
      <ambientLight color="#060c20" intensity={1.3} />
      <directionalLight position={[4, 5, 5]} color="#38bdf8" intensity={3.0} />
      <directionalLight position={[-4, -3, -3]} color="#c084fc" intensity={2.5} />
      <pointLight position={[0, -1.8, 3.2]} color="#ec4899" intensity={2.2} distance={10} />

      {/* Main Celestial Celestial Group: Streamlined, lightweight, perfectly framed */}
      <group ref={planetGroupRef} position={[0, -0.58, 0]}>
        {/* 1. Streamlined Core Planet Sphere */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[1.38, 64, 64]} />
          <meshStandardMaterial
            map={planetTexture}
            roughness={0.22}
            metalness={0.4}
            emissive="#00e5ff"
            emissiveMap={planetTexture}
            emissiveIntensity={0.6}
          />
        </mesh>

        {/* 2. Delicate Geodesic Wireframe Overlay (Sleek, airy, mathematical) */}
        <mesh ref={geodesicRef} geometry={geodesicGeo}>
          <meshBasicMaterial
            wireframe
            color="#38bdf8"
            transparent
            opacity={0.26}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* 3. Smooth Atmospheric Inner Halo */}
        <mesh ref={haloRef}>
          <sphereGeometry args={[1.45, 48, 48]} />
          <meshStandardMaterial
            color="#0ea5e9"
            transparent
            opacity={0.2}
            roughness={0.1}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 4. Smooth Outer Atmospheric Glow Fringe */}
        <mesh>
          <sphereGeometry args={[1.52, 32, 32]} />
          <meshBasicMaterial
            color="#818cf8"
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {/* 5. Primary Glowing Energy Ring */}
        <mesh
          ref={ringRef}
          rotation={[1.32, 0.18, -0.38]}
          position={[0, 0, 0]}
        >
          <ringGeometry args={[1.68, 2.75, 128]} />
          <meshBasicMaterial
            map={ringTexture}
            side={THREE.DoubleSide}
            transparent
            opacity={0.88}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* 6. Refined Secondary Razor-Thin Holographic Energy Loop */}
        <mesh
          ref={secondaryRingRef}
          rotation={[1.32, 0.18, -0.38]}
          position={[0, 0, 0]}
        >
          <ringGeometry args={[2.88, 2.92, 128]} />
          <meshBasicMaterial
            color="#38bdf8"
            side={THREE.DoubleSide}
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* 7. Subtle Inner Resonance Ring */}
        <mesh
          ref={innerRingRef}
          rotation={[1.32, 0.18, -0.38]}
          position={[0, 0, 0]}
        >
          <ringGeometry args={[1.54, 1.6, 96]} />
          <meshBasicMaterial
            color="#e879f9"
            side={THREE.DoubleSide}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* 8. Refined Cosmic Particle Dust Swarm */}
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
            size={0.03}
            vertexColors
            transparent
            opacity={0.82}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </>
  );
};

export const ThreePlanet: React.FC<ThreePlanetProps> = ({
  className = '',
  settings,
  totalEventsCount,
  totalZonesCount,
  onExploreZones,
  onEnterPlanetX
}) => {
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

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

  const formatPrizePool = (pool?: string) => {
    if (!pool) return '₹50,000 PRIZE POOL';
    const clean = pool.trim();
    if (clean.toUpperCase().includes('PRIZE')) {
      return clean.toUpperCase();
    }
    return `${clean.toUpperCase()} PRIZE POOL`;
  };

  return (
    <div className={`relative w-full overflow-hidden select-none min-h-[580px] md:min-h-[720px] lg:min-h-[820px] flex items-center justify-center ${className}`}>
      {/* 3D Scene Viewport rendered with React Three Fiber */}
      <div className="absolute inset-0 cursor-grab active:cursor-grabbing z-0 flex items-center justify-center">
        {webGlSupported ? (
          <Canvas
            camera={{ position: [0, 0.1, 4.4], fov: 46 }}
            dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance'
            }}
          >
            <Suspense fallback={null}>
              <PlanetScene speed={1} />
            </Suspense>
          </Canvas>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-radial from-cyan-950/40 to-slate-950">
            <div className="relative w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-900 via-blue-900 to-fuchsia-950 border border-cyan-400/40 shadow-[0_0_90px_rgba(6,182,212,0.4)]" />
          </div>
        )}
      </div>

      {/* Semantic DOM Typography Overlay */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center pointer-events-none pt-12 md:pt-16 pb-20">
        {/* Kicker */}
        <div className="text-[11px] sm:text-xs md:text-sm font-mono tracking-[0.22em] text-[#38bdf8] uppercase mb-2 sm:mb-3 font-semibold drop-shadow-[0_2px_12px_rgba(56,189,248,0.5)]">
          {settings?.institution ? `${settings.institution.toUpperCase()} PRESENTS` : "SVKM'S NMIMS GLOBAL UNIVERSITY, DHULE PRESENTS"}
        </div>

        {/* Main Title: PLANET-X 2026 */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[104px] font-black font-display tracking-tight text-white uppercase leading-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]">
          {settings?.eventName ? (
            settings.eventName
          ) : (
            <>
              PLANET-X{' '}
              <span className="bg-gradient-to-r from-[#38bdf8] via-[#a855f7] to-[#e879f9] bg-clip-text text-transparent">
                2026
              </span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="mt-2 sm:mt-3 md:mt-4 text-base sm:text-xl md:text-2xl font-bold tracking-wider text-white uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          {settings?.tagline || 'BEYOND INNOVATION. BEYOND LIMITS.'}
        </p>

        {/* Metric Bar: 3 ZONES / 8 COMPETITIONS / ₹50,000 PRIZE POOL */}
        <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase drop-shadow-md">
          <span className="text-white">{totalZonesCount || 3} ZONES</span>
          <span className="text-cyan-400 font-light">/</span>
          <span className="text-white">{totalEventsCount || 8} COMPETITIONS</span>
          <span className="text-cyan-400 font-light">/</span>
          <span className="text-cyan-400">{formatPrizePool(settings?.prizePool)}</span>
        </div>
      </div>
    </div>
  );
};
