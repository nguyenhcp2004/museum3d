import { useState, useEffect } from 'react'
import { RoomBase } from '../RoomBase'
import { InteractiveObject } from '../InteractiveObject'
import { Capsule, Text } from '@react-three/drei'

import { ImageFrame } from '../ImageFrame'

export function Room4(props) {
    return (
        <RoomBase {...props} title="4. Nhân dân là Chủ" color="#4a4">
            <ImageFrame url="/image/img5.jpg" position={[0, 3, -6.5]} scale={[3, 2, 1]} title="Công Nông Binh" />

            {/* People Statues */}
            <InteractiveObject position={[-2, 1, 0]} title="Giai cấp Công nhân" content="Giai cấp lãnh đạo cách mạng." color="blue">
                <Capsule args={[0.3, 1, 4]} />
            </InteractiveObject>
            <InteractiveObject position={[2, 1, 0]} title="Giai cấp Nông dân" content="Đồng minh tin cậy của giai cấp công nhân." color="green">
                <Capsule args={[0.3, 1, 4]} />
            </InteractiveObject>
            <InteractiveObject position={[0, 1, 2]} title="Trí thức" content="Lực lượng nòng cốt xây dựng đất nước." color="white">
                <Capsule args={[0.3, 1, 4]} />
            </InteractiveObject>

            <VideoScreen position={[0, 4, -9.9]} scale={[8, 4.5, 1]} url="/video/Tư_tưởng_HCM__Đảng_&_Nhà_nước.mp4" />
        </RoomBase>
    )
}

function VideoScreen({ url, position, scale }) {
    const [video, setVideo] = useState(null)
    const [paused, setPaused] = useState(true)

    // Manual video element creation to control playback
    useEffect(() => {
        const vid = document.createElement("video")
        vid.src = url
        vid.crossOrigin = "Anonymous"
        vid.loop = true
        vid.muted = false
        vid.pause()
        setVideo(vid)
    }, [url])

    const onClick = (e) => {
        e.stopPropagation()
        if (video) {
            if (video.paused) {
                video.play()
                setPaused(false)
            } else {
                video.pause()
                setPaused(true)
            }
        }
    }

    return (
        <mesh position={position} scale={scale} onClick={onClick}>
            <planeGeometry />
            {video && <meshBasicMaterial toneMapped={false}>
                <videoTexture attach="map" args={[video]} />
            </meshBasicMaterial>}
            {/* Play Button Overlay */}
            {paused && (
                <group position={[0, 0, 0.1]}>
                    <mesh rotation={[0, 0, -Math.PI / 2]}>
                        <coneGeometry args={[0.2, 0.4, 32]} />
                        <meshBasicMaterial color="white" />
                    </mesh>
                    <Text position={[0, -0.4, 0]} fontSize={0.2}>Bấm để xem</Text>
                </group>
            )}
        </mesh>
    )
}
