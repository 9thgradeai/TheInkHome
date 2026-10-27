import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import HeroScene from "./HeroScene";

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color="#c8ff4d" />
    </mesh>
  );
}

export default function Hero3DCanvas() {
  const [shouldRender, setShouldRender] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    
    // Check for low performance
    const isLowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    if (isLowPower) setShouldRender(false);
    
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (isReducedMotion || !shouldRender) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#c8ff4d]/5 via-transparent to-[#a78bfa]/5" />
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={75} />
        <Suspense fallback={<Loader />}>
          <HeroScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
