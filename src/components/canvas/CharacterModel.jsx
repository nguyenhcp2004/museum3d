import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../stores/useStore'

export function CharacterModel({ animationState = 'idle' }) {
    const group = useRef()
    const leftLeg = useRef()
    const rightLeg = useRef()
    const leftArm = useRef()
    const rightArm = useRef()

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        if (animationState === 'walk') {
            leftLeg.current.rotation.x = Math.sin(t * 10) * 0.5
            rightLeg.current.rotation.x = Math.sin(t * 10 + Math.PI) * 0.5
            leftArm.current.rotation.x = Math.sin(t * 10 + Math.PI) * 0.5
            rightArm.current.rotation.x = Math.sin(t * 10) * 0.5
        } else {
            leftLeg.current.rotation.x = 0
            rightLeg.current.rotation.x = 0
            leftArm.current.rotation.x = 0
            rightArm.current.rotation.x = 0
        }
    })

    return (
        <group ref={group} dispose={null}>
            {/* Head */}
            <mesh position={[0, 1.7, 0]} castShadow>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial color="#ffccaa" />
            </mesh>
            {/* HAT (Pith helmet style) */}
            <mesh position={[0, 1.9, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.1]} />
                <meshStandardMaterial color="#2e3b28" />
            </mesh>

            {/* Body */}
            <mesh position={[0, 1.35, 0]} castShadow>
                <boxGeometry args={[0.4, 0.5, 0.2]} />
                <meshStandardMaterial color="#2e3b28" />
            </mesh>

            {/* Arms */}
            <group position={[-0.25, 1.5, 0]} ref={leftArm}>
                <mesh position={[0, -0.25, 0]}>
                    <boxGeometry args={[0.1, 0.5, 0.1]} />
                    <meshStandardMaterial color="#2e3b28" />
                </mesh>
            </group>
            <group position={[0.25, 1.5, 0]} ref={rightArm}>
                <mesh position={[0, -0.25, 0]}>
                    <boxGeometry args={[0.1, 0.5, 0.1]} />
                    <meshStandardMaterial color="#2e3b28" />
                </mesh>
            </group>

            {/* Legs */}
            <group position={[-0.1, 1.1, 0]} ref={leftLeg}>
                <mesh position={[0, -0.35, 0]}>
                    <boxGeometry args={[0.12, 0.7, 0.12]} />
                    <meshStandardMaterial color="#554433" />
                </mesh>
            </group>
            <group position={[0.1, 1.1, 0]} ref={rightLeg}>
                <mesh position={[0, -0.35, 0]}>
                    <boxGeometry args={[0.12, 0.7, 0.12]} />
                    <meshStandardMaterial color="#554433" />
                </mesh>
            </group>
        </group>
    )
}
