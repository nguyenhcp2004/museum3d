import { RoomBase } from "../RoomBase";
import { InteractiveObject } from "../InteractiveObject";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

function Gear({ position, speed = 1 }) {
  const ref = useRef();
  useFrame((state, delta) => (ref.current.rotation.y += delta * speed));
  return (
    <group position={position} ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]} userData={{ isCollidable: true }}>
        <cylinderGeometry args={[1, 1, 0.2, 8]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  );
}

export function Room3(props) {
  return (
    <RoomBase {...props} title="3. Nguyên tắc Tổ chức" color="#333">
      <InteractiveObject
        position={[0, 2, 0]}
        title="Tập trung Dân chủ"
        content={`Nguyên tắc tổ chức cơ bản.\nDân chủ trong bàn bạc, Tập trung trong hành động.`}
      >
        <group>
          <Gear position={[-1.1, 0, 0]} speed={1} />
          <Gear position={[1.1, 0, 0]} speed={-1} />
        </group>
      </InteractiveObject>

      <InteractiveObject
        position={[3, 1, -2]}
        title="Phê bình"
        content="Tự phê bình và phê bình để tiến bộ."
        color="orange"
        Geometry="boxGeometry"
      />
    </RoomBase>
  );
}
