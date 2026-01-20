import { RoomBase } from "../RoomBase";
import { InteractiveObject } from "../InteractiveObject";

import { ImageFrame } from "../ImageFrame";

export function Room5(props) {
  return (
    <RoomBase {...props} title="5. Nhân dân làm Chủ (Quyền lực)" color="#666">
      <ImageFrame
        url="/image/img6.jpg"
        position={[3, 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        title="Bầu cử Quốc hội"
      />

      {/* Ballot Box */}
      <InteractiveObject
        position={[0, 1, 0]}
        title="Bầu cử"
        content={`"Phổ thông đầu phiếu."\nNhân dân thực hiện quyền lực thông qua Quốc hội và Hội đồng Nhân dân.`}
      >
        <group>
          <Box args={[1, 1, 1]}>
            <meshStandardMaterial color="red" />
          </Box>
          <Box args={[0.1, 0.05, 0.8]} position={[0, 0.51, 0]}>
            <meshStandardMaterial color="black" />
          </Box>
        </group>
      </InteractiveObject>

      {/* Parliament seats hint */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[-2 + i, 0.25, -3]}
          userData={{ isCollidable: true }}
        >
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="brown" />
        </mesh>
      ))}
    </RoomBase>
  );
}
