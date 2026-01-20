import { RoomBase } from "../RoomBase";
import { InteractiveObject } from "../InteractiveObject";
import { Octahedron } from "@react-three/drei";

import { ImageFrame } from "../ImageFrame";

export function Room2(props) {
  return (
    <RoomBase {...props} title="2. Đạo đức & Văn minh" color="#eee">
      <ImageFrame
        url="/image/img4.jpg"
        position={[-4.5, 2.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        title="Chủ tịch Hồ Chí Minh"
      />

      {/* Symbols of Integrity */}
      <InteractiveObject
        position={[0, 1.5, 0]}
        title="Đạo đức Cách mạng"
        content={`"Đạo đức cách mạng là cái gốc."\nCần, kiệm, liêm, chính, chí công vô tư.`}
      >
        <Octahedron args={[1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#00ffff" wireframe />
        </Octahedron>
      </InteractiveObject>

      <mesh
        position={[0, 1.5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        userData={{ isCollidable: true }}
      >
        <torusGeometry args={[2, 0.1, 16, 100]} />
        <meshStandardMaterial color="gold" />
      </mesh>

      <InteractiveObject
        position={[3, 1, 3]}
        title="Civilization"
        content="A civilized party represents the conscience and honor of the era."
        color="#ccffcc"
        Geometry="sphereGeometry"
      />
    </RoomBase>
  );
}
