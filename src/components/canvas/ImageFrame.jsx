import { Image } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";

export function ImageFrame({
  url,
  position,
  rotation,
  scale = [1, 1, 1],
  title,
}) {
  const [hovered, setHover] = useState(false);
  const groupRef = useRef();

  useEffect(() => {
    if (groupRef.current) {
      const worldPos = groupRef.current.getWorldPosition(new THREE.Vector3());
      console.log(`🖼️ ImageFrame "${title || url}":`, {
        localPos: position,
        worldPos: [
          worldPos.x.toFixed(2),
          worldPos.y.toFixed(2),
          worldPos.z.toFixed(2),
        ],
        rotation: rotation
          ? [
              rotation[0].toFixed(2),
              rotation[1].toFixed(2),
              rotation[2].toFixed(2),
            ]
          : "none",
        scale,
      });
    }
  }, [position, rotation, scale, title, url]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <Image
        url={url}
        transparent
        opacity={hovered ? 1 : 0.9}
        scale={[2, 1.5, 1]}
        position={[0, 0, 0.05]}
        color={hovered ? "white" : "#ddd"}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      />
      {/* Frame */}
      <mesh
        position={[0, 0, 0]}
        scale={[2.2, 1.7, 0.1]}
        userData={{ isCollidable: true }}
      >
        <boxGeometry />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}
