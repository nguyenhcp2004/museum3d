import { useState } from "react";
import { Text } from "@react-three/drei";
import { useStore } from "../../stores/useStore";

export function InteractiveObject({
  position,
  rotation,
  scale,
  geometry: Geometry = "boxGeometry",
  color = "hotpink",
  title,
  content,
  children,
}) {
  const [hovered, setHover] = useState(false);
  const setInteractionData = useStore((state) => state.setInteractionData);

  const handleClick = (e) => {
    e.stopPropagation();
    setInteractionData({ title, content });
  };

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        onClick={handleClick}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        userData={{ isCollidable: true }}
      >
        {children ? (
          children
        ) : (
          <>
            {Geometry === "boxGeometry" && <boxGeometry />}
            {Geometry === "sphereGeometry" && <sphereGeometry />}
            {Geometry === "cylinderGeometry" && <cylinderGeometry />}
            <meshStandardMaterial color={hovered ? "white" : color} />
          </>
        )}
      </mesh>
      {hovered && (
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="black"
        >
          {title}
        </Text>
      )}
    </group>
  );
}
