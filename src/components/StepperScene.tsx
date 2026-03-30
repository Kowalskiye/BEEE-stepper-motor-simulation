"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Line } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SimState {
  current: number;
  frequency: number;
  exploded: boolean;
  crossSection: boolean;
  xray: boolean;
  darkMode: boolean;
  selectedPart: string | null;
  running: boolean;
}

interface TooltipInfo {
  title: string;
  body: string;
  position: { x: number; y: number };
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ─── Color Palette ───────────────────────────────────────────────────────────
const BLUE_ACCENT = "#3B82F6";
const SILVER = "#E2E8F0";
const SILVER_DARK = "#94A3B8";
const BLACK_BODY = "#0F172A";
const COPPER = "#C2410C";
const FRAME_BEIGE = "#F5F5DC";

// X-Ray palette (technical schematic style)
const XR_BLUE      = "#38BDF8";
const XR_GREEN     = "#4ADE80";
const XR_ORANGE    = "#FB923C";
const XR_GRAY      = "#475569";
const XR_BG        = "#0F1419";

// ─── Component: Bearing ──────────────────────────────────────────────────────
function Bearing({ position, clippingPlanes, xray, selected }: {
  position: [number, number, number];
  clippingPlanes: THREE.Plane[];
  xray: boolean;
  selected: boolean;
}) {
  return (
    <group position={position}>
      {/* Outer Race */}
      <mesh material-clippingPlanes={clippingPlanes}>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 32, 1, true]} />
        <meshStandardMaterial color={selected ? "#60A5FA" : SILVER_DARK} metalness={0.9} roughness={0.1} side={THREE.DoubleSide} emissive={selected ? "#60A5FA" : "#000"} emissiveIntensity={selected ? 0.5 : 0} />
      </mesh>
      {/* Inner Race */}
      <mesh material-clippingPlanes={clippingPlanes}>
        <cylinderGeometry args={[0.16, 0.16, 0.15, 32, 1, true]} />
        <meshStandardMaterial color={selected ? "#60A5FA" : SILVER_DARK} metalness={0.9} roughness={0.1} side={THREE.DoubleSide} emissive={selected ? "#60A5FA" : "#000"} emissiveIntensity={selected ? 0.5 : 0} />
      </mesh>
      {/* Ball Seal */}
      <mesh material-clippingPlanes={clippingPlanes} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.076, 0]}>
        <ringGeometry args={[0.16, 0.3, 32]} />
        <meshStandardMaterial color="#475569" metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh material-clippingPlanes={clippingPlanes} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.076, 0]}>
        <ringGeometry args={[0.16, 0.3, 32]} />
        <meshStandardMaterial color="#475569" metalness={0.2} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Component: Stator Frame (Insulator) ─────────────────────────────────────
function StatorFrame({ clippingPlanes, xray, selected }: { clippingPlanes: THREE.Plane[]; xray: boolean; selected: boolean }) {
  const poles = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ angle: (i / 8) * Math.PI * 2, key: i })), []);
  return (
    <group>
      {poles.map(({ angle, key }) => (
        <mesh key={key}
          position={[Math.cos(angle) * 0.72, 0, Math.sin(angle) * 0.72]}
          rotation={[0, -angle, 0]}
          material-clippingPlanes={clippingPlanes}>
          <boxGeometry args={[0.16, 0.86, 0.2]} />
          <meshStandardMaterial color={selected ? "#FDE68A" : FRAME_BEIGE} roughness={0.9} transparent opacity={xray ? 0.2 : 1} emissive={selected ? "#F59E0B" : "#000"} emissiveIntensity={selected ? 0.5 : 0} />
        </mesh>
      ))}
      <mesh material-clippingPlanes={clippingPlanes}>
        <cylinderGeometry args={[0.85, 0.85, 0.86, 32, 1, true]} />
        <meshStandardMaterial color={selected ? "#FDE68A" : FRAME_BEIGE} roughness={0.9} side={THREE.DoubleSide} transparent opacity={xray ? 0.1 : 1} emissive={selected ? "#F59E0B" : "#000"} emissiveIntensity={selected ? 0.5 : 0} />
      </mesh>
    </group>
  );
}

// ─── Component: Permanent Magnet (Ring Shape as per Image) ────────────────────
function PermanentMagnet({ clippingPlanes, xray, crossSection, selected }: { clippingPlanes: THREE.Plane[]; xray: boolean; crossSection: boolean; selected: boolean }) {
  const color = selected ? "#F87171" : (crossSection ? "#E2E8F0" : "#3B82F6");
  const emissive = selected ? "#EF4444" : (crossSection ? "#000000" : "#0055FF");
  return (
    <group>
      {/* Outer Magnet Ring Shell */}
      <mesh material-clippingPlanes={clippingPlanes} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.22, 32, 1, true]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0.05} emissive={emissive} emissiveIntensity={selected ? 1 : 0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner Magnet Ring Shell */}
      <mesh material-clippingPlanes={clippingPlanes} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.22, 32, 1, true]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0.05} emissive={emissive} emissiveIntensity={selected ? 1 : 0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* Top/Bottom Caps for the Magnet Ring */}
      {[0, 0.22].map((y, i) => (
        <mesh key={i} material-clippingPlanes={clippingPlanes} position={[0, y - 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.38, 32]} />
          <meshStandardMaterial color={color} metalness={1} roughness={0.05} side={THREE.DoubleSide} emissive={emissive} emissiveIntensity={selected ? 1 : 0} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Component: Stator Laminations ───────────────────────────────────────────
function StatorLaminations({ clippingPlanes, xray, selected }: { clippingPlanes: THREE.Plane[]; xray: boolean; selected: boolean }) {
  const color = selected ? "#60A5FA" : (xray ? XR_BLUE : "#1E293B");
  return (
    <group>
      {/* Outer Wall */}
      <mesh material-clippingPlanes={clippingPlanes}>
        <cylinderGeometry args={[1.05, 1.05, 0.84, 64, 1, true]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} side={THREE.DoubleSide} emissive={selected ? "#3B82F6" : "#000"} emissiveIntensity={selected ? 0.5 : 0} />
      </mesh>
      {/* Inner Wall - Adjusted to avoid poles overlap */}
      <mesh material-clippingPlanes={clippingPlanes}>
        <cylinderGeometry args={[0.88, 0.88, 0.84, 64, 1, true]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} side={THREE.DoubleSide} emissive={selected ? "#3B82F6" : "#000"} emissiveIntensity={selected ? 0.5 : 0} />
      </mesh>
      {/* Solid Caps */}
      {[0.42, -0.42].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material-clippingPlanes={clippingPlanes}>
          <ringGeometry args={[0.88, 1.05, 64]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} side={THREE.DoubleSide} emissive={selected ? "#3B82F6" : "#000"} emissiveIntensity={selected ? 0.5 : 0} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Component: Rotor (Detailed from Image) ──────────────────────────────────
function Rotor({ rotationRef, explodedOffset, clippingPlanes, xray, crossSection, selectedPart, onClick }: {
  rotationRef: React.MutableRefObject<number>;
  explodedOffset: React.MutableRefObject<number>;
  clippingPlanes: THREE.Plane[];
  xray: boolean;
  crossSection: boolean;
  selectedPart: string | null;
  onClick: (name: string, e: any) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const teeth = useMemo(() => Array.from({ length: 50 }, (_, i) => ({ angle: (i / 50) * Math.PI * 2, key: i })), []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = rotationRef.current;
    groupRef.current.position.y = -explodedOffset.current * 1.6;
  });

  const isSelected = selectedPart === "Rotor";
  const baseColor = isSelected ? "#60A5FA" : (crossSection ? "#2563EB" : "#1E293B");
  const toothColor = isSelected ? "#BFDBFE" : (crossSection ? "#F8FAFC" : null);

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick("Rotor", e); }}>
      {/* Central Shaft */}
      <mesh material-clippingPlanes={clippingPlanes} position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 1.8, 32]} />
        <meshStandardMaterial color={isSelected ? "#60A5FA" : (crossSection ? "#1E293B" : SILVER)} metalness={1} roughness={0.05} />
      </mesh>

      {/* Support Base Body */}
      <mesh material-clippingPlanes={clippingPlanes} position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.4, 32]} />
        <meshStandardMaterial color={baseColor} metalness={1} roughness={0.1} emissive={isSelected ? "#3B82F6" : "#000"} emissiveIntensity={isSelected ? 0.5 : 0} />
      </mesh>

      {/* Magnet Ring sitting on the Base */}
      <group position={[0, 0, 0]}>
        <PermanentMagnet clippingPlanes={clippingPlanes} xray={xray} crossSection={crossSection} selected={selectedPart === "Magnet"} />
      </group>
      
      {/* Outer Cage Teeth */}
      {teeth.map(({ angle, key }) => (
        <mesh key={key}
          position={[Math.cos(angle) * 0.54, 0.05, Math.sin(angle) * 0.54]}
          rotation={[0, -angle, 0]}
          material-clippingPlanes={clippingPlanes}>
          <boxGeometry args={[0.015, 0.72, 0.04]} />
          {xray
            ? <meshBasicMaterial color={XR_GRAY} transparent opacity={0.4} depthWrite={false} />
            : <meshStandardMaterial 
                color={toothColor || (key % 2 === 0 ? "#CBD5E1" : "#1E293B")} 
                metalness={1} roughness={0.05} emissive={isSelected ? "#3B82F6" : "#000"} emissiveIntensity={isSelected ? 0.5 : 0} />}
        </mesh>
      ))}

      <Bearing position={[0, 0.45, 0]} clippingPlanes={clippingPlanes} xray={xray} selected={selectedPart === "Bearing"} />
      <Bearing position={[0, -0.45, 0]} clippingPlanes={clippingPlanes} xray={xray} selected={selectedPart === "Bearing"} />
    </group>
  );
}

// ─── Component: Stator ───────────────────────────────────────────────────────
function Stator({ explodedOffset, clippingPlanes, current, xray, selectedPart, onClick }: {
  explodedOffset: React.MutableRefObject<number>;
  clippingPlanes: THREE.Plane[];
  current: number; xray: boolean;
  selectedPart: string | null;
  onClick: (name: string, e: any) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const poleRefs = useRef<THREE.Mesh[]>([]);
  const phase = useRef(0);
  const poles = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ angle: (i / 8) * Math.PI * 2, key: i })), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = explodedOffset.current * 0.6;
    phase.current += delta * 3;
    poleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const wave = Math.sin(phase.current + (i * Math.PI) / 4) * 0.5 + 0.5;
      const isHighlighted = selectedPart === "Stator";
      if (xray) {
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.15 + wave * current * 0.5;
      } else {
        const hIntensity = isHighlighted ? 3.0 : 1.5;
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = wave * current * hIntensity;
        if (isHighlighted) (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(XR_GREEN);
      }
    });
  });

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick("Stator", e); }}>
      <StatorFrame clippingPlanes={clippingPlanes} xray={xray} selected={selectedPart === "Stator"} />
      <StatorLaminations clippingPlanes={clippingPlanes} xray={xray} selected={selectedPart === "Stator"} />
      {poles.map(({ angle, key }) => (
        <mesh key={key}
          ref={(el) => { if (el) poleRefs.current[key] = el; }}
          position={[Math.cos(angle) * 0.72, 0, Math.sin(angle) * 0.72]}
          rotation={[0, -angle, 0]}
          material-clippingPlanes={clippingPlanes}>
          <boxGeometry args={[0.12, 0.75, 0.18]} />
          {xray
            ? <meshBasicMaterial color={XR_GREEN} transparent opacity={0.25} depthWrite={false} />
            : <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} emissive={XR_GREEN} emissiveIntensity={0} />}
        </mesh>
      ))}
    </group>
  );
}

// ─── Component: Windings ─────────────────────────────────────────────────────
function Windings({ explodedOffset, clippingPlanes, current, xray, selectedPart, onClick }: {
  explodedOffset: React.MutableRefObject<number>;
  clippingPlanes: THREE.Plane[];
  current: number; xray: boolean;
  selectedPart: string | null;
  onClick: (name: string, e: any) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const windingRefs = useRef<THREE.Mesh[]>([]);
  const coils = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ angle: (i / 8) * Math.PI * 2, key: i })), []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.y = explodedOffset.current * 0.8;
    windingRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const wave = Math.sin(Date.now() * 0.003 + i * 0.8) * 0.5 + 0.5;
      const isHighlighted = selectedPart === "Windings";
      if (xray) {
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.15 + wave * current * 0.5;
      } else {
        const hIntensity = isHighlighted ? 3.0 : 1.5;
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = wave * current * hIntensity;
        if (isHighlighted) (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(XR_ORANGE);
      }
    });
  });

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick("Windings", e); }}>
      {coils.map(({ angle, key }) => (
        <group key={key} rotation={[0, -angle, 0]} position={[Math.cos(angle) * 0.72, 0, Math.sin(angle) * 0.72]}>
          {[-0.22, 0, 0.22].map((y, yi) => (
            <mesh key={yi}
              ref={(el) => { if (el) windingRefs.current[key * 3 + yi] = el; }}
              position={[0, y, 0]}
              material-clippingPlanes={clippingPlanes}>
              <torusGeometry args={[0.1, 0.025, 8, 20]} />
              {xray
                ? <meshBasicMaterial color={XR_ORANGE} transparent opacity={0.25} depthWrite={false} />
                : <meshStandardMaterial color="#F97316" metalness={1} roughness={0.1} emissive="#C2410C" emissiveIntensity={0.2} side={THREE.DoubleSide} />}
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ─── Component: Casing ───────────────────────────────────────────────────────
function Casing({ explodedOffset, clippingPlanes, xray, darkMode, selectedPart, onClick }: {
  explodedOffset: React.MutableRefObject<number>;
  clippingPlanes: THREE.Plane[];
  xray: boolean;
  darkMode: boolean;
  selectedPart: string | null;
  onClick: (name: string, e: any) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const isSelected = selectedPart === "Casing";

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick("Casing", e); }}>
      {/* Front and Back End Caps */}
      {[-0.5, 0.5].map((y, i) => (
        <group key={i} position={[0, y + (y > 0 ? explodedOffset.current * 3.2 : -explodedOffset.current * 3.5), 0]}>
          <mesh material-clippingPlanes={clippingPlanes}>
            <boxGeometry args={[2.2, 0.15, 2.2]} />
            {xray
              ? <meshBasicMaterial color={XR_BLUE} transparent opacity={0.2} depthWrite={false} />
              : <meshStandardMaterial color={isSelected ? (darkMode ? "#60A5FA" : "#3B82F6") : (darkMode ? "#1E293B" : SILVER)} metalness={0.8} roughness={0.2} emissive={isSelected ? "#3B82F6" : "#000"} emissiveIntensity={isSelected ? 0.5 : 0} />}
          </mesh>
          {/* Bolts */}
          {[[-0.9, -0.9], [-0.9, 0.9], [0.9, -0.9], [0.9, 0.9]].map(([bx, bz], bi) => (
            <mesh key={bi} position={[bx, 0.05, bz]} material-clippingPlanes={clippingPlanes}>
              <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
              <meshStandardMaterial color={darkMode ? "#334155" : SILVER_DARK} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Front Mounting Boss */}
      <mesh position={[0, 0.5 + explodedOffset.current * 3.2, 0]} material-clippingPlanes={clippingPlanes}>
         <cylinderGeometry args={[0.5, 0.5, 0.18, 32]} />
         <meshStandardMaterial color={darkMode ? "#1E293B" : SILVER} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─── Component: Leader Lines ─────────────────────────────────────────────────
function LeaderLines({ explodedOffset }: { explodedOffset: number }) {
  if (explodedOffset < 0.1) return null;
  return (
    <group>
      {/* Main axis line */}
      <Line points={[[0, -4, 0], [0, 4, 0]]} color="#94A3B8" lineWidth={0.5} dashed dashScale={5} dashSize={0.2} opacity={explodedOffset * 0.3} transparent />
      {/* Radial connectors to key parts */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <Line key={i} points={[[0, 0, 0], [Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5]]} 
                color="#94A3B8" lineWidth={0.5} dashed dashScale={10} opacity={explodedOffset * 0.2} transparent />
        );
      })}
    </group>
  );
}

// ─── Main 3D Scene ────────────────────────────────────────────────────────────
function MotorScene({ sim, onClick: handleClick }: { sim: SimState; onClick: (name: string, e: any) => void }) {
  const { gl } = useThree();
  const rotationRef = useRef(0);
  const explodedOffset = useRef(0);
  const stepAngle = useRef(0);
  const accumulator = useRef(0);
  const STEP = (1.8 * Math.PI) / 180;

  const clippingPlanes = useMemo(() => {
    // Return empty array if cross section is disabled
    if (!sim.crossSection) return [];
    // Offset by 0.01 to avoid numerical flicker on plane-aligned surfaces
    return [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.01)];
  }, [sim.crossSection]);

  useEffect(() => { gl.localClippingEnabled = true; }, [gl]);

  useFrame((_, delta) => {
    explodedOffset.current = lerp(explodedOffset.current, sim.exploded ? 1 : 0, delta * 3.5);
    if (!sim.running) return;
    
    // Rotation Drive: Accumulate target rotation smoothly
    accumulator.current += delta * (sim.frequency / 20); // Scaled for fluidity
    const targetRotation = accumulator.current * Math.PI * 2;
    rotationRef.current = lerp(rotationRef.current, targetRotation, delta * 15); // Smooth easing
  });

  return (
    <>
      {sim.xray ? (
        <>
          <ambientLight intensity={0.04} />
          <pointLight position={[0, 0, 0]} intensity={0.3} color={XR_BLUE} distance={6} />
          <pointLight position={[0, 3, 0]} intensity={0.4} color={XR_GREEN} distance={8} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-5, -3, -1]} intensity={0.6} color="#E2E8F0" />
          <pointLight position={[0, 3, 2]} intensity={0.8} color={BLUE_ACCENT} distance={10} />
          <Environment preset="city" />
        </>
      )}

      <LeaderLines explodedOffset={explodedOffset.current} />
      <Casing explodedOffset={explodedOffset} clippingPlanes={clippingPlanes} xray={sim.xray} darkMode={sim.darkMode} selectedPart={sim.selectedPart} onClick={handleClick} />
      <Stator explodedOffset={explodedOffset} clippingPlanes={clippingPlanes} current={sim.current} xray={sim.xray} selectedPart={sim.selectedPart} onClick={handleClick} />
      <Windings explodedOffset={explodedOffset} clippingPlanes={clippingPlanes} current={sim.current} xray={sim.xray} selectedPart={sim.selectedPart} onClick={handleClick} />
      <Rotor rotationRef={rotationRef} explodedOffset={explodedOffset} clippingPlanes={clippingPlanes} xray={sim.xray} crossSection={sim.crossSection} selectedPart={sim.selectedPart} onClick={handleClick} />

      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        {sim.xray || sim.darkMode
          ? <meshBasicMaterial color={sim.darkMode ? "#0F172A" : XR_BG} />
          : <meshStandardMaterial color="#F3F4F6" metalness={0.02} roughness={0.95} />}
      </mesh>
    </>
  );
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function GlassPanel({ children, className = "", xray = false, darkMode = false }: {
  children: React.ReactNode; className?: string; xray?: boolean; darkMode?: boolean;
}) {
  const isDark = xray || darkMode;
  return (
    <div className={`backdrop-blur-xl border rounded-2xl shadow-xl transition-all duration-500 ${
      isDark ? "bg-[#001828]/80 border-white/10" : "bg-white/80 border-slate-200/50 shadow-slate-200/20"
    } ${className}`}>
      {children}
    </div>
  );
}

function Slider({ label, unit, value, min, max, step, onChange, xray = false, darkMode = false }: {
  label: string; unit: string; value: number; min: number; max: number;
  step: number; onChange: (v: number) => void; xray?: boolean; darkMode?: boolean;
}) {
  const isDark = xray || darkMode;
  const accent = xray ? XR_BLUE : BLUE_ACCENT;
  const textColor = isDark ? "text-white/40" : "text-slate-500";
  const valColor = isDark ? "text-white" : "text-slate-900";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className={`text-[10px] tracking-[0.2em] uppercase font-bold font-mono ${textColor}`}>{label}</span>
        <span className={`text-sm font-mono tabular-nums ${valColor}`} style={xray ? { color: accent } : {}}>
          {value.toFixed(step < 1 ? 1 : 0)}
          <span className="opacity-40 text-xs ml-1">{unit}</span>
        </span>
      </div>
      <div className={`relative h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
        <div className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${((value - min) / (max - min)) * 100}%`, background: accent }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full pointer-events-none shadow-sm border-2 border-white"
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 8px)`, background: accent }} />
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, children, xray = false, darkMode = false }: {
  active: boolean; onClick: () => void; children: React.ReactNode; xray?: boolean; darkMode?: boolean;
}) {
  const isDark = xray || darkMode;
  return (
    <button onClick={onClick}
      className={`w-full py-2.5 px-4 rounded-xl text-[10px] tracking-[0.15em] uppercase font-bold font-mono transition-all duration-200 border ${
        active
          ? isDark ? "bg-sky-500/15 border-sky-500/50 text-sky-400"
                   : "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20"
          : isDark ? "bg-white/[0.03] border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                   : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
      }`}>
      {children}
    </button>
  );
}

function XRayLegend() {
  const items = [
    { color: XR_BLUE,   label: "Casing & Structure" },
    { color: XR_GREEN,  label: "Magnetic Fields" },
    { color: XR_ORANGE, label: "Current Loops" },
    { color: XR_GRAY,   label: "Mechanical Core" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="absolute right-5 bottom-20 w-52 z-20">
      <div className="backdrop-blur-xl bg-[#001828]/80 border border-white/10 rounded-xl p-4">
        <div className="text-[9px] tracking-[0.35em] uppercase text-sky-400/70 font-mono mb-3">Technical Legend</div>
        <div className="space-y-2">
          {items.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-6 h-px" style={{ background: color }} />
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[10px] text-white/50 font-mono">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function XRayReadouts({ sim, stepIndex }: { sim: SimState; stepIndex: number }) {
  const items = [
    { label: "Step Index", value: (stepIndex % 200).toString().padStart(3, "0"), unit: "PTR", color: XR_ORANGE },
    { label: "Torque", value: (sim.current * 0.18).toFixed(3), unit: "N·m", color: XR_GREEN },
    { label: "Flux Bias", value: (sim.current * 0.42).toFixed(2), unit: "T", color: XR_BLUE },
    { label: "Pos Deg", value: ((stepIndex * 1.8) % 360).toFixed(1), unit: "°", color: XR_GRAY },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-none z-20">
      {items.map(({ label, value, unit, color }) => (
        <div key={label}
          className="backdrop-blur-xl bg-[#001828]/70 border rounded-lg px-3 py-2 text-center"
          style={{ borderColor: `${color}30` }}>
          <div className="text-[8px] tracking-[0.3em] uppercase font-mono mb-0.5" style={{ color: `${color}90` }}>{label}</div>
          <div className="text-sm font-mono tabular-nums" style={{ color }}>{value}</div>
          <div className="text-[8px] font-mono text-white/20">{unit}</div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Component: Main Stepper Scene (Container) ───────────────────────────────
export default function StepperScene() {
  const [sim, setSim] = useState<SimState>({
    current: 1.4, frequency: 8, exploded: false, crossSection: false, xray: false, darkMode: false, selectedPart: null, running: true,
  });
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const simRef = useRef(sim);
  simRef.current = sim;

  const TOOLTIPS: Record<string, { title: string; body: string }> = {
    Rotor: { title: "Rotor & Magnet", body: "A hybrid rotor consisting of a neodymium permanent magnet core sandwiched between two multipole steel cups. The 50-tooth geometry enables ultra-precise 1.8° increments." },
    Stator: { title: "Laminated Stator", body: "Constructed from thin silicon steel laminations to minimize eddy current losses. The stack directs magnetic flux to the precise air gap for maximum holding torque." },
    Windings: { title: "Phase Coils", body: "High-temperature copper windings. When pulsed by the driver, they transform electrical energy into a precisely stepping magnetic field." },
    Casing: { title: "BEEE Housing", body: "Industrial-standard 42mm aluminum casing. Features a precision front pilot boss and standardized mounting holes for sub-millimeter alignment." },
    Bearing: { title: "Shaft Bearings", body: "Sealed deep-groove ball bearings. They maintain the critical 50-micron air gap between the rotor and stator under high radial and axial loads." },
    Frame: { title: "Insulator Frame", body: "Glass-filled thermoplastic frame that acts as a dielectric barrier, preventing phase-to-ground faults while providing structural mounting for the coils." },
  };

  const handleClick = useCallback((name: string, e: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const info = TOOLTIPS[name];
    if (!info) return;
    setSim(s => ({ ...s, selectedPart: name }));
    const pos = e && e.nativeEvent ? { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY } : { x: 0, y: 0 };
    setTooltip({ ...info, position: pos });
  }, []);

  useEffect(() => {
    if (!sim.running) return;
    const id = setInterval(() => { setStepCount((s) => s + Math.round(simRef.current.frequency)); }, 1000);
    return () => clearInterval(id);
  }, [sim.running]);

  const accent = sim.xray ? XR_BLUE : BLUE_ACCENT;

  const isDark = sim.xray || sim.darkMode;
  return (
    <div className="relative w-full h-screen overflow-hidden transition-colors duration-700"
      style={{ background: sim.xray ? XR_BG : (sim.darkMode ? "#020617" : "#F1F5F9") }}>

      <Canvas
        camera={{ position: [4, 2.5, 4], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: sim.xray ? 0.7 : 1.2 }}
        shadows onClick={() => { setTooltip(null); setSim(s => ({...s, selectedPart: null})); }}>
        <MotorScene sim={sim} onClick={handleClick} />
        <OrbitControls enablePan={false} minDistance={2.5} maxDistance={9} maxPolarAngle={Math.PI * 0.82} makeDefault />
      </Canvas>

      {/* Theme Toggle Overlay */}
      <div className="absolute top-8 right-8 z-50">
         <button onClick={() => setSim(s => ({...s, darkMode: !s.darkMode}))}
           className={`p-3 rounded-full backdrop-blur-xl border transition-all duration-300 ${
             isDark ? "bg-white/5 border-white/10 text-sky-400" : "bg-white border-slate-200 text-slate-400 shadow-sm"
           }`}>
           {sim.darkMode ? "☀" : "☾"}
         </button>
      </div>

      {/* Header */}
      <div className="absolute top-4 md:top-8 left-4 md:left-8 pointer-events-none z-20">
        <div className="space-y-0 md:space-y-1">
          <div className="flex items-center gap-2 md:gap-3">
             <div className="w-6 md:w-8 h-[2px]" style={{ background: accent }} />
             <span className={`text-[8px] md:text-[10px] tracking-[0.4em] uppercase font-bold font-mono ${isDark ? "text-sky-400/60" : "text-slate-400"}`}>
               {sim.xray ? "Diagnostic Overide" : "Engineering Interface"}
             </span>
          </div>
          <h1 className={`text-lg md:text-2xl font-black tracking-tighter uppercase italic ${isDark ? "text-white" : "text-slate-900"}`}>
            BEEE <span className="font-light not-italic opacity-40 ml-1 md:ml-2">High-Torque Simulator</span>
          </h1>
        </div>
      </div>

      <AnimatePresence>{sim.xray && <XRayReadouts sim={sim} stepIndex={stepCount} />}</AnimatePresence>

      {/* Control Panel (Left -> Bottom/Compact on Mobile) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-5 md:bottom-auto md:translate-x-0 md:left-5 md:top-1/2 md:-translate-y-1/2 w-[92vw] md:w-64 space-y-2 md:space-y-3 z-20 pointer-events-none transition-all duration-500">
        
        {/* Compact Mode Strip (Mobile Only) */}
        <div className="flex md:hidden gap-1.5 overflow-x-auto pb-1.5 px-1 no-scrollbar pointer-events-auto">
          {[
            { id: "xray", label: "X-Ray", active: sim.xray },
            { id: "exploded", label: "Exploded", active: sim.exploded },
            { id: "crossSection", label: "Cross", active: sim.crossSection },
          ].map(m => (
            <button key={m.id} onClick={() => setSim(s => ({...s, [m.id as keyof SimState]: !s[m.id as keyof SimState]}))}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border transition-all ${
                m.active ? "bg-sky-500/20 border-sky-500 text-sky-400" : "bg-white/10 border-white/5 text-white/30"
              }`}>
              {m.label}
            </button>
          ))}
        </div>

        <GlassPanel className="p-3 md:p-5 space-y-3 md:space-y-5 pointer-events-auto shadow-2xl" xray={sim.xray} darkMode={sim.darkMode}>
          <div>
            <div className="flex justify-between items-center mb-2 md:mb-4">
              <div className="text-[7px] md:text-[9px] tracking-[0.3em] uppercase font-mono font-black" style={{ color: `${accent}70` }}>BEEE DYNAMICS</div>
              <button onClick={() => setSim(s => ({...s, running: !s.running}))} className={`md:hidden px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-colors ${
                sim.running ? "bg-red-500/20 border-red-500/30 text-red-500" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"
              }`}>
                {sim.running ? "STOP" : "START"}
              </button>
            </div>
            
            <div className="space-y-3 md:space-y-5">
              <Slider label="Amperage" unit="A" value={sim.current} min={0.2} max={2.8} step={0.1}
                onChange={(v) => setSim((s) => ({ ...s, current: v }))} xray={sim.xray} darkMode={sim.darkMode} />
              <Slider label="Frequency" unit="Hz" value={sim.frequency} min={1} max={60} step={1}
                onChange={(v) => setSim((s) => ({ ...s, frequency: v }))} xray={sim.xray} darkMode={sim.darkMode} />
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-1.5">
              {[
                { label: "Holding", value: (sim.current * 0.45).toFixed(2), unit: "N·cm" },
                { label: "Velocity", value: Math.round((sim.frequency * 60) / 200).toString(), unit: "RPM" },
              ].map(({ label, value, unit }) => (
                <div key={label} className={`rounded-xl p-1.5 md:p-2.5 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-100"}`}>
                   <div className="text-[6px] tracking-widest uppercase font-bold text-slate-400 mb-0.5">{label}</div>
                   <div className={`text-[10px] md:text-sm font-mono font-black ${isDark ? "text-white" : "text-slate-900"}`}>{value}</div>
                   <div className="text-[7px] font-mono opacity-40">{unit}</div>
                </div>
              ))}
          </div>

          {/* Compact Inspector (Mobile Only) */}
          <div className="md:hidden pt-2 border-t border-white/5">
             <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {["Casing", "Stator", "Windings", "Rotor", "Bearing", "Frame"].map((name) => {
                  const active = sim.selectedPart === name;
                  return (
                    <button key={name} className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[7px] uppercase font-black transition-all ${
                      active ? "bg-blue-600 text-white" : "bg-white/5 text-white/30"
                    }`} onClick={(e) => handleClick(name, e)}>
                      {name}
                    </button>
                  );
                })}
             </div>
          </div>
        </GlassPanel>
      </div>

      {/* Visual Modes (Right -> Sidebar on Tablets/Desktop) */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 w-52 space-y-3 z-20 hidden md:block">
        <GlassPanel className="p-4 space-y-3" xray={sim.xray} darkMode={sim.darkMode}>
          <div className="text-[9px] tracking-[0.35em] uppercase font-mono mb-1 text-slate-400">Analysis Modes</div>
          <button
            onClick={() => setSim((s) => ({ ...s, xray: !s.xray }))}
            className="w-full py-3 px-4 rounded-xl text-[10px] tracking-[0.15em] uppercase font-bold font-mono transition-all duration-300 border"
            style={sim.xray
              ? { background: "rgba(56,189,248,0.12)", borderColor: `${XR_BLUE}50`, color: XR_BLUE }
              : { background: "#F8FAFC", borderColor: "#E2E8F0", color: "#64748B" }}>
            {sim.xray ? "◈ Active: X-Ray" : "◈ Mode: Blueprint"}
          </button>
          <ToggleButton active={sim.exploded} onClick={() => setSim((s) => ({ ...s, exploded: !s.exploded }))} xray={sim.xray} darkMode={sim.darkMode}>
             Exploded View
          </ToggleButton>
          <ToggleButton active={sim.crossSection} onClick={() => setSim((s) => ({ ...s, crossSection: !s.crossSection }))} xray={sim.xray} darkMode={sim.darkMode}>
             Cross Section
          </ToggleButton>
          <hr className="opacity-10" />
          <button onClick={() => setSim((s) => ({ ...s, running: !s.running }))}
            className={`w-full py-3 rounded-xl text-[10px] tracking-[0.15em] uppercase font-bold font-mono transition-all duration-300 border ${
              sim.running ? "bg-red-50 border-red-200 text-red-500 shadow-sm" : "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm"
            }`}>
            {sim.running ? "■ Hard Stop" : "▶ Start Drive"}
          </button>
        </GlassPanel>

        {/* Part Inspector List */}
        <GlassPanel className="p-4" xray={sim.xray} darkMode={sim.darkMode}>
          <div className={`text-[10px] tracking-[0.2em] uppercase font-bold font-mono mb-3 ${isDark ? "text-sky-400" : "text-slate-400"}`}>Direct Inspect</div>
          <div className="grid grid-cols-1 gap-1">
            {["Casing", "Stator", "Windings", "Rotor", "Bearing", "Frame"].map((name) => {
              const active = sim.selectedPart === name;
              return (
                <button key={name} className={`flex items-center gap-3 py-1.5 px-2 rounded-lg text-left group transition-all duration-300 ${
                  active ? (isDark ? "bg-white/10" : "bg-blue-50") : (isDark ? "hover:bg-white/5" : "hover:bg-slate-50")
                }`} onClick={(e) => handleClick(name, e)}>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${active ? "scale-125 shadow-[0_0_8px_currentColor]" : (isDark ? "opacity-30 group-hover:opacity-100" : "")}`} 
                       style={{ background: active ? BLUE_ACCENT : accent }} />
                  <span className={`text-[10px] uppercase font-bold font-mono transition-colors ${active ? (isDark ? "text-white" : "text-blue-600") : (isDark ? "text-white/40 group-hover:text-white" : "text-slate-500 group-hover:text-slate-900")}`}>{name}</span>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      <AnimatePresence>{sim.xray && <XRayLegend />}</AnimatePresence>

      {/* Inspector Side Panel Overlay (Responsive positioning) */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="absolute left-5 right-5 bottom-32 md:bottom-auto md:left-auto md:right-5 md:top-1/2 md:translate-y-1/2 md:w-64 z-50 pointer-events-auto">
            <div className={`backdrop-blur-3xl rounded-2xl p-5 md:p-6 border shadow-2xl transition-colors ${
              isDark ? "bg-[#001828]/95 border-sky-400/30 text-white" : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50"
            }`}>
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 md:w-1.5 h-5 md:h-6 rounded-full" style={{ background: accent }} />
                  <span className="text-[10px] md:text-[12px] tracking-[0.2em] uppercase font-black font-mono">{tooltip.title}</span>
                </div>
                <button onClick={() => setTooltip(null)} className="text-[8px] md:text-[10px] font-black opacity-30 hover:opacity-100 transition-opacity">CLOSE</button>
              </div>
              <p className="text-[10px] md:text-xs leading-relaxed font-medium opacity-70 mb-4">{tooltip.body}</p>
              <div className="pt-3 md:pt-4 border-t border-current opacity-10 flex justify-between items-center">
                 <span className="text-[8px] md:text-[9px] font-black tracking-widest uppercase">Safety Check: Pass</span>
                 <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_bg-emerald-400]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Status (Always visible, more compact on mobile) */}
      <div className="absolute bottom-2 md:bottom-5 left-1/2 -translate-x-1/2 z-20 w-fit">
        <GlassPanel className="px-3 py-1.5 md:px-6 md:py-3" xray={sim.xray} darkMode={sim.darkMode}>
          <div className="flex items-center gap-3 md:gap-6 text-[7px] md:text-[9px] font-mono tracking-widest uppercase">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${sim.running ? "bg-emerald-400 animate-pulse outline outline-2 outline-emerald-400/20" : "bg-red-400"}`} />
              <span className="opacity-70 font-black">{sim.running ? "Active" : "Halt"}</span>
            </div>
            <div className="w-px h-2 md:h-3 bg-current opacity-10" />
            <span className="opacity-50 font-bold hidden xs:inline">1.8° Res</span>
            <div className="w-px h-2 md:h-3 bg-current opacity-10 hidden xs:inline" />
            <span style={{ color: `${accent}80` }} className="font-bold tracking-[0.2em] md:tracking-[0.3em] truncate max-w-[80px] md:max-w-none">Live Telemetry</span>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
