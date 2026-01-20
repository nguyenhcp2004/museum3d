import { RoomBase } from '../RoomBase'
import { InteractiveObject } from '../InteractiveObject'
import { Box, Cylinder } from '@react-three/drei'

export function Room6(props) {
    return (
        <RoomBase {...props} title="6. Nhà nước Pháp quyền XHCN" color="#334455">
            {/* Constitution Book / Quiz */}
            <InteractiveObject
                position={[0, 1.5, 0]}
                title="Câu đố Hiến pháp"
                content={`Câu hỏi: Văn bản nào có hiệu lực pháp lý cao nhất?\nA. Luật Đất đai\nB. Hiến pháp\n(Đáp án đúng: B - Hiến pháp là đạo luật gốc)`}
                color="red"
            >
                <Box args={[1.5, 0.2, 1]} rotation={[0.2, 0, 0]} />
            </InteractiveObject>

            {/* Scale of Justice */}
            <InteractiveObject position={[2, 2, -2]} title="Công lý" content="Mọi công dân bình đẳng trước pháp luật." color="gold">
                <group>
                    <Cylinder args={[0.05, 0.05, 3]} position={[0, 0, 0]} />
                    <Box args={[2, 0.05, 0.05]} position={[0, 1.5, 0]} />
                    <Cylinder args={[0.5, 0.05, 0.2]} position={[-1, 1, 0]} />
                    <Cylinder args={[0.5, 0.05, 0.2]} position={[1, 1, 0]} />
                </group>
            </InteractiveObject>
        </RoomBase>
    )
}
