import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { BodyModel } from './BodyModel'
import { useAppStore } from '../../store'

/**
 * PR-01: 3D body viewer with GLB model and ~20 clickable regions.
 * PR-02: Click → region mapping via invisible proxy meshes.
 */
export function BodyViewer() {
  const selectedBodyRegion = useAppStore((s) => s.selectedBodyRegion)
  const setSelectedBodyRegion = useAppStore((s) => s.setSelectedBodyRegion)
  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
      style={{ width: '100%', height: 700 }}
    >
      <Canvas
        camera={{ position: [0, 1.2, 15], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        fallback={
          <div className="flex items-center justify-center w-full h-full text-slate-600 text-sm bg-slate-200">
            WebGL unavailable — 3D viewer cannot load
          </div>
        }
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 4, 4]} intensity={1} />
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
          }
        >
          <BodyModel
            onSelectRegion={setSelectedBodyRegion}
            highlightedRegion={selectedBodyRegion}
            yOffset={-5}
            proxyScale={1.8}
            proxyZOffset={0.6}
          />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          enableRotate
          target={[0, 1, 0]}
          minDistance={1000}
          maxDistance={2000}
        />
      </Canvas>
    </div>
  )
}
