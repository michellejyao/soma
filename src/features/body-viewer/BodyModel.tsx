import { useRef, useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { type Group, Mesh, Box3, Vector3 } from "three";
import { useGLTF, useCursor } from "@react-three/drei";
import type { BodyRegionId } from "../../types";
import { BODY_REGIONS, type BodyRegionId as BodyRegion } from "../../types";

const MODEL_PATH = "/basic_human_male.glb";
const LOCKED_MODEL_SCALE = 0.02;

const PROXY_REGIONS: Array<{
  id: BodyRegion;
  position: [number, number, number];
  radius?: number;
  height?: number;
  type: "sphere" | "capsule";
}> = [
  { id: "head", position: [0, 1.15, 0.02], radius: 0.12, type: "sphere" },
  { id: "neck", position: [0, 0.95, 0.02], radius: 0.06, height: 0.12, type: "capsule" },
  { id: "chest", position: [0, 0.72, 0.02], radius: 0.12, height: 0.2, type: "capsule" },
  { id: "abdomen", position: [0, 0.4, 0.02], radius: 0.11, height: 0.2, type: "capsule" },
  { id: "pelvis", position: [0, 0.1, 0.02], radius: 0.1, height: 0.15, type: "capsule" },
  { id: "back", position: [0, 0.5, -0.12], radius: 0.1, height: 0.5, type: "capsule" },
  { id: "left_shoulder", position: [-0.24, 0.88, 0.02], radius: 0.07, type: "sphere" },
  { id: "left_upper_arm", position: [-0.38, 0.65, 0.02], radius: 0.055, height: 0.22, type: "capsule" },
  { id: "left_forearm", position: [-0.48, 0.35, 0.02], radius: 0.045, height: 0.2, type: "capsule" },
  { id: "left_hand", position: [-0.5, 0.1, 0.02], radius: 0.05, type: "sphere" },
  { id: "right_shoulder", position: [0.24, 0.88, 0.02], radius: 0.07, type: "sphere" },
  { id: "right_upper_arm", position: [0.38, 0.65, 0.02], radius: 0.055, height: 0.22, type: "capsule" },
  { id: "right_forearm", position: [0.48, 0.35, 0.02], radius: 0.045, height: 0.2, type: "capsule" },
  { id: "right_hand", position: [0.5, 0.1, 0.02], radius: 0.05, type: "sphere" },
  { id: "left_upper_leg", position: [-0.1, -0.2, 0.02], radius: 0.07, height: 0.25, type: "capsule" },
  { id: "left_lower_leg", position: [-0.1, -0.48, 0.02], radius: 0.055, height: 0.25, type: "capsule" },
  { id: "left_foot", position: [-0.1, -0.72, -0.01], radius: 0.045, type: "sphere" },
  { id: "right_upper_leg", position: [0.1, -0.2, 0.02], radius: 0.07, height: 0.25, type: "capsule" },
  { id: "right_lower_leg", position: [0.1, -0.48, 0.02], radius: 0.055, height: 0.25, type: "capsule" },
  { id: "right_foot", position: [0.1, -0.72, -0.01], radius: 0.045, type: "sphere" },
];

interface BodyModelProps {
  onSelectRegion: (region: BodyRegionId) => void;
  highlightedRegion?: BodyRegionId | null;
  yOffset?: number;           // world units
  rotation?: [number, number, number];

  proxyScale?: number;        // default 1
  proxyZOffset?: number;      // default 0.03
}

useGLTF.preload(MODEL_PATH);

export function BodyModel({
  onSelectRegion,
  highlightedRegion,
  yOffset = 0,
  rotation,
  proxyScale = 1,
  proxyZOffset = 0.03,
}: BodyModelProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const { scene } = useGLTF(MODEL_PATH) as { scene: Group };

  const regionSet = useMemo(() => new Set(BODY_REGIONS), []);

  // Visual scene: clone + disable raycast so proxies get clicks
  const displayScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child instanceof Mesh) {
        child.raycast = () => undefined;
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
      }
    });
    return clone;
  }, [scene]);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const region = (e.object as Mesh).userData?.region as BodyRegionId | undefined;
    if (region && regionSet.has(region)) onSelectRegion(region);
  };

  const { centeredPosition, uniformScale } = useMemo(() => {
    const box = new Box3().setFromObject(displayScene);
    const center = new Vector3();
    box.getCenter(center);
    const scale = LOCKED_MODEL_SCALE;

    return {
      centeredPosition: [-center.x * scale, -center.y * scale + yOffset, -center.z * scale] as [
        number,
        number,
        number
      ],
      uniformScale: scale,
    };
  }, [displayScene, yOffset]);

  const appliedRotation = rotation ?? ([0, 0, Math.PI / 2] as [number, number, number]);

  return (
    <group ref={groupRef} position={centeredPosition} scale={uniformScale}>
      <group rotation={appliedRotation}>
        <primitive object={displayScene} />

        <group position={[0, 0, proxyZOffset]}>
          {PROXY_REGIONS.map(({ id, position, radius = 0.05, height = 0.1, type }) => {
            const scaledRadius = radius * proxyScale;
            const scaledHeight = height * proxyScale;

            return (
              <group key={id} position={position}>
                <mesh
                  name={id}
                  userData={{ region: id }}
                  renderOrder={1}
                  onPointerDown={onPointerDown}
                  onPointerOver={() => setHovered(true)}
                  onPointerOut={() => setHovered(false)}
                >
                  {type === "sphere" ? (
                    <sphereGeometry args={[scaledRadius, 12, 12]} />
                  ) : (
                    <capsuleGeometry
                      args={[scaledRadius, Math.max(0.01, scaledHeight - scaledRadius * 2), 4, 8]}
                    />
                  )}
                  <meshBasicMaterial
                    color={highlightedRegion === id ? "#818cf8" : "#ef4444"}
                    transparent
                    opacity={highlightedRegion === id ? 0.35 : 0}
                    depthWrite={false}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
}
