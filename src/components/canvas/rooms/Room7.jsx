import { RoomBase } from '../RoomBase'
import { InteractiveObject } from '../InteractiveObject'
import { Sphere, Octahedron } from '@react-three/drei'

export function Room7(props) {
    return (
        <RoomBase {...props} title="7. Nhà nước Trong sạch & Vững mạnh" color="#111">
            {/* Dark corridor transition to light */}

            {/* Corruption blobs */}
            <InteractiveObject position={[-2, 1, 2]} title="Tham nhũng" content="Kiên quyết chống tham nhũng, làm trong sạch Đảng." color="#330000" Geometry="sphereGeometry" />

            {/* National Emblem / Bright Future */}
            <InteractiveObject
                position={[0, 3, -8]}
                title="Vinh quang Tổ quốc"
                content="Nhà nước trong sạch, vững mạnh, hiệu lực, hiệu quả phục vụ Nhân dân."
                color="gold"
            >
                <group>
                    <Octahedron args={[1]} position={[0, 0, 0]}>
                        <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={2} />
                    </Octahedron>
                    <pointLight intensity={2} distance={10} color="yellow" />
                </group>
            </InteractiveObject>

            <pointLight position={[0, 5, -5]} intensity={1} />
        </RoomBase>
    )
}
