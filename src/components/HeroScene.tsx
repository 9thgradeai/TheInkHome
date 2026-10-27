import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

function FloatingGlyph({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = rotation[0] + Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.y = rotation[1] + Math.cos(state.clock.elapsedTime * 0.2) * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position}>
        <torusKnotGeometry args={[0.3, 0.08, 100, 16]} />
        <meshStandardMaterial
          color="#c8ff4d"
          emissive="#c8ff4d"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const points = useRef<THREE.Points>(null);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.x = state.clock.elapsedTime * 0.05;
      points.current.rotation.y = state.clock.elapsedTime * 0.075;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#c8ff4d"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

export default function HeroScene() {
  const { viewport } = useThree();
  
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#c8ff4d" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a78bfa" />
      
      <ParticleField />
      
      <FloatingGlyph position={[-2, 1, -3]} rotation={[0.5, 0.5, 0]} />
      <FloatingGlyph position={[2, -1, -4]} rotation={[1, 0, 0.5]} />
      <FloatingGlyph position={[0, 2, -5]} rotation={[0, 1, 1]} />
      
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <mesh position={[viewport.width > 5 ? 1.5 : 0, -0.5, -2]}>
          <icosahedronGeometry args={[0.8, 1]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#c8ff4d"
            emissiveIntensity={0.2}
            metalness={0.9}
            roughness={0.1}
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      </Float>
    </>
  );
}
