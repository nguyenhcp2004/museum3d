import { RoomBase } from "../RoomBase";
import { InteractiveObject } from "../InteractiveObject";
import { ImageFrame } from "../ImageFrame";

export function Room1(props) {
  return (
    <RoomBase
      {...props}
      title="1. Sự cần thiết & Vai trò lãnh đạo"
      color="#800000"
    >
      {/* Historical Images */}
      {/* Adjusted positions to fit standard 10x20 room */}
      <ImageFrame
        url="/image/img1.jpg"
        position={[-4.9, 2.5, 2]}
        rotation={[0, Math.PI / 2, 0]}
        title="Democratic Republic"
      />
      <ImageFrame
        url="/image/img2.jpg"
        position={[4.9, 2.5, -2]}
        rotation={[0, -Math.PI / 2, 0]}
        title="Dien Bien Phu Victory"
      />
      <ImageFrame
        url="/image/img3.jpg"
        position={[0, 4, -9.5]}
        scale={[2, 2, 1]}
        title="Party Flag"
      />

      {/* Red Flag pole */}
      <mesh position={[0, 2, -2]} userData={{ isCollidable: true }}>
        <cylinderGeometry args={[0.1, 0.1, 4]} />
        <meshStandardMaterial color="silver" />
      </mesh>
      {/* Flag */}
      <mesh position={[0.8, 3.5, -2]}>
        <boxGeometry args={[1.5, 1, 0.1]} />
        <meshStandardMaterial color="red" />
      </mesh>

      {/* Boat */}
      <InteractiveObject
        position={[0, 0.5, 0]}
        title="Con Thuyền Cách Mạng"
        content={`"Chèo lái qua những con sóng dữ của thực dân."\nĐảng đã dẫn dắt dân tộc qua những cơn bão lịch sử đến bến bờ độc lập.`}
      >
        <group>
          {/* Hull */}
          <Box args={[2, 0.5, 4]} position={[0, 0, 0]}>
            <meshStandardMaterial color="brown" />
          </Box>
          {/* Sail */}
          <Box args={[0.1, 3, 2]} position={[0, 1.5, 0]}>
            <meshStandardMaterial color="white" />
          </Box>
        </group>
      </InteractiveObject>

      {/* Timeline markers */}
      <InteractiveObject
        position={[-3, 1, 5]}
        title="1945"
        content="Cách mạng tháng Tám - Thành lập VNDCCH."
        color="gold"
      />
      <InteractiveObject
        position={[-3, 1, 0]}
        title="1954"
        content="Chiến thắng Điện Biên Phủ."
        color="gold"
      />
      <InteractiveObject
        position={[-3, 1, -5]}
        title="1975"
        content="Giải phóng miền Nam, thống nhất đất nước."
        color="gold"
      />
    </RoomBase>
  );
}
