import { useEffect, useState, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { SRGBColorSpace, BoxHelper } from "three";

import * as THREE from "three";
import { useAutoArtPlacements } from "./AutoArtPlacer";
import { useStore } from "../../stores/useStore";
import { speakText, stopSpeaking } from "../../utils/textToSpeech";

function MuseumModel({ debug = false, onSceneReady }) {
  const { scene } = useGLTF(
    "/animations/virtual-gallery-scene-01/source/Scene 01.glb"
  );

  // COLLISION SETUP ONLY (No texture replacement here since it's a single mesh)
  useEffect(() => {
    if (debug) {
      console.log("🏛️ Museum Scene Structure:");
    }

    const walls = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        child.name = "col-wall";
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) child.material.side = 2;

        // Compute bounding box
        child.geometry.computeBoundingBox();
        const bbox = child.geometry.boundingBox;

        // Get world position and scale
        child.updateMatrixWorld(true);
        const worldPos = child.getWorldPosition(new THREE.Vector3());
        const worldScale = child.getWorldScale(new THREE.Vector3());

        // Calculate actual world bounding box
        const min = bbox.min.clone().multiply(worldScale).add(worldPos);
        const max = bbox.max.clone().multiply(worldScale).add(worldPos);

        walls.push({
          mesh: child,
          localBBox: { min: bbox.min.toArray(), max: bbox.max.toArray() },
          worldBBox: { min: min.toArray(), max: max.toArray() },
          position: worldPos.toArray(),
          scale: worldScale.toArray(),
        });

        // Debug: log mesh info
        if (debug) {
          console.log(`📦 Mesh #${walls.length}:`, child.name);
          console.log(`  Local Position:`, child.position.toArray());
          console.log(`  World Position:`, worldPos.toArray());
          console.log(`  Scale:`, worldScale.toArray());
          console.log(`  Local BBox min:`, bbox.min.toArray());
          console.log(`  Local BBox max:`, bbox.max.toArray());
          console.log(`  World BBox min:`, min.toArray());
          console.log(`  World BBox max:`, max.toArray());

          // Calculate wall dimensions
          const width = Math.abs(max.x - min.x);
          const height = Math.abs(max.y - min.y);
          const depth = Math.abs(max.z - min.z);
          console.log(
            `  📏 Dimensions: ${width.toFixed(2)} x ${height.toFixed(
              2
            )} x ${depth.toFixed(2)}`
          );
          console.log("---");

          // Add visual helper
          const helper = new BoxHelper(child, 0x00ff00);
          scene.add(helper);
        }
      }
    });

    if (debug) {
      console.log(`\n🏛️ Total walls found: ${walls.length}`);
    }

    // Notify parent that scene is ready
    if (onSceneReady) {
      onSceneReady(scene);
    }
  }, [scene, debug, onSceneReady]);

  return (
    <primitive
      object={scene}
      scale={3}
      position={[0, -5, 0]}
      onClick={(e) => {
        e.stopPropagation();
      }}
    />
  );
}

function ArtFrame({ position, rotation, texture, scale = [1, 1, 1], artworkData, onArtworkClick }) {
  const frameRef = useRef();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (frameRef.current) {
      // Debug: Log vị trí thực tế của frame
      const worldPos = new THREE.Vector3();
      frameRef.current.getWorldPosition(worldPos);
      console.log(`🖼️ ArtFrame at:`, {
        position,
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
      });
    }
  }, [position, rotation]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);

  const handleClick = (e) => {
    console.log('🖼️ ========== CLICK EVENT ==========');
    console.log('   Event type:', e.type);
    console.log('   Event object:', e.object?.name || 'unnamed');
    console.log('   Has artworkData:', !!artworkData);
    console.log('   Artwork title:', artworkData?.title);
    console.log('   Has onArtworkClick:', !!onArtworkClick);
    console.log('   Pointer locked:', !!document.pointerLockElement);
    console.log('   Event stopped:', e.stopped);
    console.log('================================');
    
    e.stopPropagation();
    
    if (artworkData && onArtworkClick) {
      console.log('✅ Calling onArtworkClick for:', artworkData.title);
      onArtworkClick(artworkData);
    } else {
      console.warn('⚠️ Click ignored - missing data or handler');
    }
  };

  return (
    <group 
      ref={frameRef} 
      position={position} 
      rotation={rotation} 
      scale={scale}
      onClick={(e) => {
        console.log('🖱️ ========== GROUP CLICKED! ==========');
        console.log('   Group position:', position);
        console.log('   Artwork:', artworkData?.title);
        handleClick(e);
      }}
      onPointerDown={(e) => {
        console.log('👇 POINTER DOWN on artwork:', artworkData?.title);
      }}
      onPointerUp={() => {
        console.log('👆 POINTER UP on artwork:', artworkData?.title);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        console.log('🔵 Pointer over artwork:', artworkData?.title);
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        console.log('🔴 Pointer out artwork:', artworkData?.title);
        setHovered(false);
      }}
    >
      {/* Frame border - Khung tranh màu đen - SIZE: 5×6 */}
      <mesh position={[0, 0, 0]} userData={{ isCollidable: true, isArtwork: true, artworkData }}>
        <boxGeometry args={[5.2, 6.2, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Artwork - positioned slightly in front of frame - SIZE: 5×6 */}
      <mesh 
        position={[0, 0, 0.08]} 
        userData={{ isArtwork: true, artworkData }}
      >
        <planeGeometry args={[5, 6]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.FrontSide}
          toneMapped={false}
          depthTest={true}
          depthWrite={true}
          emissive={hovered ? "#444444" : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
    </group>
  );
}

export function Museum() {
  const [museumScene, setMuseumScene] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [artworksData, setArtworksData] = useState([]);
  const { setInteractionData } = useStore();

  // Load artworks data from JSON
  useEffect(() => {
    fetch('/imageDescriptions.json')
      .then(res => res.json())
      .then(data => {
        // Convert object to array
        const artworksArray = Object.entries(data).map(([filename, info], index) => ({
          id: index + 1,
          image: `/image-version2/image/${filename}`,
          title: info.title,
          content: info.description
        }));
        setArtworksData(artworksArray);
        console.log('✅ Loaded artworks data:', artworksArray.length);
      })
      .catch(err => console.error('❌ Failed to load artworks data:', err));
  }, []);

  // Handle artwork click
  const handleArtworkClick = (artworkData) => {
    console.log('🎨 Opening artwork:', artworkData.title);
    
    // Stop any currently playing speech
    stopSpeaking();
    
    // Show interaction panel
    setInteractionData({
      title: artworkData.title,
      content: artworkData.content,
    });

    // Speak the content
    const fullText = `${artworkData.title}. ${artworkData.content}`;
    speakText(fullText).then((audio) => {
      if (audio) {
        // Auto close popup when audio ends
        audio.addEventListener('ended', () => {
          console.log('🔊 Audio ended - Auto closing popup');
          setTimeout(() => {
            setInteractionData(null);
          }, 1000); // Wait 1 second after audio ends
        });
      }
    });
  };

  // LOAD CUSTOM IMAGES - Version 2
  const customImages = useTexture([
    "/image-version2/image/anh1.jpg",
    "/image-version2/image/anh2.jpg",
    "/image-version2/image/anh3.jpg",
    "/image-version2/image/anh4.jpg",
    "/image-version2/image/anh5.jpg",
    "/image-version2/image/anh6.jpg",
    "/image-version2/image/anh7.jpg",
    "/image-version2/image/anh8.jpg",
    "/image-version2/image/anh9.jpg",
    "/image-version2/image/anh10.jpg",
    "/image-version2/image/anh11.jpg",
    "/image-version2/image/anh12.jpg",
    "/image-version2/image/anh13.jpg",
    "/image-version2/image/anh14.jpg",
    "/image-version2/image/anh15.jpg",
    "/image-version2/image/anh16.jpg",
  ]);

  customImages.forEach((tex) => {
    tex.colorSpace = SRGBColorSpace;
    tex.flipY = true; // Set to true to fix upside-down images
  });

  // Debug mode toggle
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "F3") {
        const newDebugMode = !debugMode;
        setDebugMode(newDebugMode);
        console.log(`\n${"=".repeat(60)}`);
        console.log(`🔧 DEBUG MODE: ${newDebugMode ? "ENABLED" : "DISABLED"}`);
        console.log(`${"=".repeat(60)}\n`);
        if (newDebugMode) {
          console.log("📍 Debug Features:");
          console.log("  - Grid Helper (floor grid)");
          console.log("  - Axes Helper (XYZ axes)");
          console.log("  - Red Spheres = Artwork positions");
          console.log("  - Green Arrows = Wall normals");
          console.log("  - Yellow Arrows = Artwork facing direction");
          console.log("  - Magenta Sphere = No artworks detected\n");
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [debugMode]);

  // 🔥 AUTO WALL DETECTION & ARTWORK PLACEMENT v2.0
  const artworkPlacements = useAutoArtPlacements(museumScene, customImages.length, {
    minWallArea: 3, // Minimum 3m² wall area
    verticalThreshold: 0.3, // Walls must be fairly vertical (normal.y < 0.3) - STRICTER
    minHeight: 2, // Minimum 2m height
    rayDirections: 24, // Cast 24 rays (every 15 degrees)
    heightSamples: 6, // Sample at 6 different heights
    spacing: 4, // 4m minimum distance between artworks - SPACING FILTER
    heightFromFloor: 2, // 2m from floor (museum scale)
    offsetFromWall: 0.6, // 0.6m from wall surface - INCREASED to prevent clipping
    debug: debugMode,
  });

  const handleSceneReady = (scene) => {
    setMuseumScene(scene);
    if (debugMode) {
      console.log("🎨 Museum scene ready for wall detection");
    }
    
    // Expose scene to window for debugging
    if (typeof window !== 'undefined') {
      window.museumScene = scene;
      window.testWallDetection = () => {
        console.log("\n🧪 Manual Wall Detection Test");
        console.log("Scene:", scene);
        console.log("Use: import { WallDetector } from './utils/wallDetector'");
        console.log("Then: const detector = new WallDetector({ debug: true })");
        console.log("Then: detector.detectWalls(window.museumScene)");
      };
    }
  };

  return (
    <group>
      <fog attach="fog" args={["#101015", 5, 40]} />
      <MuseumModel debug={debugMode} onSceneReady={handleSceneReady} />

      {/* Grid helper for debugging */}
      {debugMode && (
        <>
          <gridHelper args={[100, 100, "#444", "#222"]} position={[0, 0, 0]} />
          <axesHelper args={[50]} />
        </>
      )}

      {/* 🔥 AUTO-PLACED ART FRAMES */}
      {artworkPlacements.length > 0 ? (
        artworkPlacements.map((placement, i) => (
          <group key={i}>
            <ArtFrame
              position={placement.position}
              rotation={placement.rotation}
              texture={customImages[i % customImages.length]}
              artworkData={artworksData[i]}
              onArtworkClick={handleArtworkClick}
            />
            {/* Debug position markers */}
            {debugMode && (
              <>
                {/* Red sphere at artwork position */}
                <mesh position={placement.position}>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshBasicMaterial color="#ff0000" />
                </mesh>
                {/* Green arrow showing wall normal */}
                <arrowHelper
                  args={[
                    new THREE.Vector3(...placement.wallNormal),
                    new THREE.Vector3(...placement.position),
                    2,
                    0x00ff00,
                  ]}
                />
                {/* Yellow arrow showing artwork facing direction */}
                <arrowHelper
                  args={[
                    new THREE.Vector3(
                      -Math.sin(placement.rotation[1]),
                      0,
                      -Math.cos(placement.rotation[1])
                    ),
                    new THREE.Vector3(...placement.position),
                    1.5,
                    0xffff00,
                  ]}
                />
              </>
            )}
          </group>
        ))
      ) : (
        debugMode && (
          <group position={[0, 2, 0]}>
            <mesh>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial color="#ff00ff" />
            </mesh>
          </group>
        )
      )}

      {/* Debug info */}
      {debugMode && artworkPlacements.length > 0 && (
        <group>
          <mesh position={[0, 5, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
        </group>
      )}
    </group>
  );
}
useGLTF.preload("/animations/virtual-gallery-scene-01/source/Scene 01.glb");
