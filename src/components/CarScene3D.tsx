import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Animated particle ring ────────────────────────────────── */
function Particles() {
  const COUNT = 120;
  const mesh  = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data  = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi:   Math.random() * Math.PI,
      r:     4.5 + Math.random() * 3.5,
      speed: (Math.random() - 0.5) * 0.3,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(s => {
    if (!mesh.current) return;
    const t = s.clock.elapsedTime;
    data.forEach((p, i) => {
      const theta = p.theta + t * p.speed * 0.12;
      const bob   = Math.sin(t * 0.8 + p.offset) * 0.4;
      dummy.position.set(
        p.r * Math.sin(p.phi) * Math.cos(theta),
        p.r * Math.cos(p.phi) * 0.45 + bob,
        p.r * Math.sin(p.phi) * Math.sin(theta)
      );
      const s2 = 0.035 + Math.abs(Math.sin(t * 0.6 + p.offset)) * 0.025;
      dummy.scale.setScalar(s2);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#F5A623" transparent opacity={0.55} />
    </instancedMesh>
  );
}

/* ─── Glowing ring accent ────────────────────────────────────── */
function GlowRing() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(s => {
    if (mesh.current) {
      mesh.current.rotation.x = Math.PI / 2 + Math.sin(s.clock.elapsedTime * 0.4) * 0.06;
      mesh.current.rotation.z = s.clock.elapsedTime * 0.08;
    }
  });
  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <torusGeometry args={[3.2, 0.022, 12, 180]} />
      <meshBasicMaterial color="#F5A623" transparent opacity={0.28} />
    </mesh>
  );
}

function GlowRing2() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(s => {
    if (mesh.current) {
      mesh.current.rotation.x = Math.PI / 2 + 0.3 + Math.sin(s.clock.elapsedTime * 0.3 + 1) * 0.06;
      mesh.current.rotation.z = -s.clock.elapsedTime * 0.05;
    }
  });
  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <torusGeometry args={[4.2, 0.012, 8, 180]} />
      <meshBasicMaterial color="#fff" transparent opacity={0.07} />
    </mesh>
  );
}

/* ─── Ground reflection plane ────────────────────────────────── */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
      <planeGeometry args={[28, 28]} />
      <meshStandardMaterial
        color="#08090f"
        metalness={0.72}
        roughness={0.28}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/* ─── Horizontal divider bar ─────────────────────────────────── */
function DividerBar() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(s => {
    if (mesh.current) {
      (mesh.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.2 + Math.sin(s.clock.elapsedTime * 1.4) * 0.5;
    }
  });
  return (
    <mesh ref={mesh} position={[0, -0.26, 0]}>
      <boxGeometry args={[6.2, 0.038, 0.038]} />
      <meshStandardMaterial color="#F5A623" emissive="#F5A623" emissiveIntensity={1.4} />
    </mesh>
  );
}

/* ─── Corner accent diamonds ─────────────────────────────────── */
function CornerDiamonds() {
  const positions: [number, number, number][] = [
    [-3.2,  0.72, 0], [3.2,  0.72, 0],
    [-3.2, -0.72, 0], [3.2, -0.72, 0],
  ];
  return (
    <>
      {positions.map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.12, 0.12, 0.04]} />
          <meshStandardMaterial color="#F5A623" emissive="#F5A623" emissiveIntensity={2} />
        </mesh>
      ))}
    </>
  );
}

/* ─── Main text group ────────────────────────────────────────── */
function BrandText() {
  const group = useRef<THREE.Group>(null);

  useFrame(s => {
    if (group.current) {
      group.current.position.y = Math.sin(s.clock.elapsedTime * 0.65) * 0.08;
    }
  });

  return (
    <group ref={group} position={[0, 0.1, 0]}>
      {/* AUTO ECOLE */}
      <Text
        position={[0, 0.72, 0]}
        fontSize={0.84}
        letterSpacing={0.14}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        AUTO ECOLE
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFFFFF"
          emissiveIntensity={0.15}
          metalness={0.4}
          roughness={0.3}
        />
      </Text>

      {/* Divider bar */}
      <DividerBar />

      {/* PLUS */}
      <Text
        position={[0, -0.72, 0]}
        fontSize={1.42}
        letterSpacing={0.22}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        PLUS
        <meshStandardMaterial
          color="#F5A623"
          emissive="#F5A623"
          emissiveIntensity={0.65}
          metalness={0.3}
          roughness={0.4}
        />
      </Text>

      {/* Corner accents */}
      <CornerDiamonds />
    </group>
  );
}

/* ─── Spotlight beams ────────────────────────────────────────── */
function Spotlights() {
  const l1 = useRef<THREE.SpotLight>(null);
  const l2 = useRef<THREE.SpotLight>(null);
  useFrame(s => {
    const t = s.clock.elapsedTime;
    if (l1.current) l1.current.intensity = 28 + Math.sin(t * 0.7) * 4;
    if (l2.current) l2.current.intensity = 22 + Math.sin(t * 0.9 + 1) * 4;
  });
  return (
    <>
      <spotLight ref={l1} position={[-5, 8, 4]}  angle={0.28} penumbra={0.6} color="#FFF8E7" intensity={28} target-position={[0, 0, 0]} castShadow />
      <spotLight ref={l2} position={[ 5, 7, 3]}  angle={0.28} penumbra={0.6} color="#FFD070" intensity={22} target-position={[0, 0, 0]} />
      <pointLight position={[0, -1, 2.5]} color="#F5A623" intensity={6} distance={6} />
      <pointLight position={[0,  3, -2]}  color="#4060FF" intensity={4} distance={8} />
    </>
  );
}

/* ─── Full scene ─────────────────────────────────────────────── */
function Scene() {
  return (
    <>
      <color attach="background" args={['#060810']} />
      <fog attach="fog" args={['#060810', 14, 28]} />

      <ambientLight intensity={0.18} color="#1a2040" />
      <hemisphereLight args={['#0d1520', '#0a0800', 0.22]} />
      <Spotlights />

      <Ground />
      <GlowRing />
      <GlowRing2 />
      <Particles />
      <BrandText />
    </>
  );
}

/* ─── Export ─────────────────────────────────────────────────── */
interface CarScene3DProps {
  scrollY?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function CarScene3D({ style, className }: CarScene3DProps) {
  return (
    <div style={{ width: '100%', height: '100%', ...style }} className={className}>
      <Canvas
        camera={{ position: [0, 0.5, 9], fov: 38 }}
        shadows={{ type: 1 }}
        gl={{ antialias: true }}
      >
        <Scene />
        <OrbitControls
          target={[0, 0, 0]}
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.9}
          minPolarAngle={Math.PI / 3.5}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
