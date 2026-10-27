import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

function InkDrop({ position, delay = 0 }: { position: [number, number, number], delay?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime + delay;
      meshRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.3;
      meshRef.current.rotation.x = t * 0.3;
      meshRef.current.rotation.z = t * 0.2;
      meshRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.1);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshPhysicalMaterial
          color="#1a1a1a"
          emissive="#c8ff4d"
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={0.1}
          transmission={0.6}
          thickness={0.5}
          transparent
        />
      </mesh>
    </Float>
  );
}

function QuillPen({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.3;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
      <group ref={groupRef} position={position} rotation={[0.3, 0.5, 0.2]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.02, 0.015, 1.6, 8]} />
          <meshStandardMaterial color="#8b4513" metalness={0.3} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.7, 0]}>
          <coneGeometry args={[0.08, 0.3, 8]} />
          <meshStandardMaterial 
            color="#2a1810" 
            emissive="#c8ff4d"
            emissiveIntensity={0.15}
            metalness={0.2} 
            roughness={0.6} 
          />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <coneGeometry args={[0.02, 0.15, 6]} />
          <meshStandardMaterial color="#c8ff4d" emissive="#c8ff4d" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

function OpenBook({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} position={position}>
        <mesh position={[-0.4, 0, 0]} rotation={[0, -0.1, 0]}>
          <boxGeometry args={[0.8, 1.0, 0.05]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
        </mesh>
        <mesh position={[0.4, 0, 0]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[0.8, 1.0, 0.05]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[0.02, 1.0, 0.08]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        {/* Pages with text lines */}
        {[...Array(6)].map((_, i) => (
          <mesh key={i} position={[-0.4, 0.3 - i * 0.12, 0.001]} rotation={[0, -0.1, 0]}>
            <planeGeometry args={[0.6, 0.02]} />
            <meshBasicMaterial color="#333" transparent opacity={0.6} />
          </mesh>
        ))}
        {[...Array(6)].map((_, i) => (
          <mesh key={i} position={[0.4, 0.3 - i * 0.12, 0.001]} rotation={[0, 0.1, 0]}>
            <planeGeometry args={[0.6, 0.02]} />
            <meshBasicMaterial color="#333" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function InkFlow() {
  const points = useRef<THREE.Points>(null);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 8 - 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (points.current) {
      const positions = points.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(state.clock.elapsedTime + i) * 0.001;
        if (positions[i + 1] > 6) positions[i + 1] = -4;
      }
      points.current.geometry.attributes.position.needsUpdate = true;
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
        size={0.02}
        color="#c8ff4d"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export default function InkHomeScene() {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5;
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-3, 2, 2]} intensity={0.6} color="#c8ff4d" />
      <pointLight position={[3, -2, 2]} intensity={0.4} color="#a78bfa" />
      
      <InkFlow />
      
      {!isMobile && (
        <>
          <QuillPen position={[-2.5, 0.5, -2]} />
          <OpenBook position={[2, -0.5, -3]} />
        </>
      )}
      
      <InkDrop position={[-1, 1, -1]} delay={0} />
      <InkDrop position={[1.2, 0.8, -1.5]} delay={1} />
      <InkDrop position={[-0.5, -1, -2]} delay={2} />
      <InkDrop position={[0.8, -0.8, -1.2]} delay={0.5} />
      
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh position={[0, 0, -4]}>
          <ringGeometry args={[2, 2.1, 64]} />
          <meshBasicMaterial color="#c8ff4d" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      </Float>
    </>
  );
}
