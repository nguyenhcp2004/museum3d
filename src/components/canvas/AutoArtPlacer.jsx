import { useRef, useEffect, useState } from "react";
import { WallDetector, placeArtworksOnWalls } from "../../utils/wallDetector";
import * as THREE from "three";

/**
 * 🎨 Auto Art Placer Component
 * Automatically detects walls and places artworks on them
 */
export function AutoArtPlacer({ scene, artworks, debug = false }) {
  const [placements, setPlacements] = useState([]);
  const [walls, setWalls] = useState([]);
  const detectorRef = useRef(null);

  useEffect(() => {
    if (!scene) return;

    // Initialize detector
    if (!detectorRef.current) {
      detectorRef.current = new WallDetector({
        minWallArea: 10, // at least 10m² to be considered
        verticalThreshold: 0.3, // how vertical the wall must be
        minHeight: 2, // minimum 2m height
        debug,
      });
    }

    // Wait for scene to be fully loaded
    const timeout = setTimeout(() => {
      try {
        // Detect walls
        const detectedWalls = detectorRef.current.detectWalls(scene);
        setWalls(detectedWalls);

        if (debug) {
          console.log(`✅ Detected ${detectedWalls.length} walls`);
        }

        // Place artworks
        if (detectedWalls.length > 0 && artworks.length > 0) {
          const artworkPlacements = placeArtworksOnWalls(
            detectedWalls,
            artworks.length,
            {
              spacing: 6, // 6m between artworks
              heightFromFloor: 1.5, // 1.5m from floor
              offsetFromWall: 0.3, // 30cm from wall
              debug,
            }
          );

          setPlacements(artworkPlacements);

          if (debug) {
            console.log(`✅ Placed ${artworkPlacements.length} artworks`);
          }
        }
      } catch (error) {
        console.error("❌ Error in wall detection:", error);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [scene, artworks.length, debug]);

  // Render debug helpers
  if (debug && walls.length > 0) {
    return (
      <group>
        {/* Debug: Show detected wall centers */}
        {walls.map((wall, i) => (
          <mesh key={`wall-${i}`} position={wall.position}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#00ff00" wireframe />
          </mesh>
        ))}

        {/* Debug: Show artwork positions */}
        {placements.map((placement, i) => (
          <mesh key={`placement-${i}`} position={placement.position}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        ))}
      </group>
    );
  }

  return null;
}

/**
 * Hook to get artwork placements
 */
export function useAutoArtPlacements(scene, artworkCount, options = {}) {
  const [placements, setPlacements] = useState([]);
  const { debug = false } = options;

  useEffect(() => {
    if (!scene) return;

    const detector = new WallDetector({
      minWallArea: options.minWallArea || 10,
      verticalThreshold: options.verticalThreshold || 0.3,
      minHeight: options.minHeight || 2,
      rayDirections: options.rayDirections || 16,
      heightSamples: options.heightSamples || 5,
      debug,
    });

    // Wait a bit for scene to be ready
    const timeout = setTimeout(() => {
      try {
        const walls = detector.detectWalls(scene);
        
        if (walls.length > 0) {
          const artPlacements = placeArtworksOnWalls(walls, artworkCount, {
            spacing: options.spacing || 6,
            heightFromFloor: options.heightFromFloor || 1.5,
            offsetFromWall: options.offsetFromWall || 0.3,
            scene: scene, // 🔥 Pass scene for secondary raycast
            debug,
          });

          setPlacements(artPlacements);

          if (debug) {
            console.log(`🎨 Auto-placed ${artPlacements.length} artworks on ${walls.length} walls`);
          }
        } else {
          console.warn("⚠️ No walls detected!");
        }
      } catch (error) {
        console.error("❌ Wall detection error:", error);
        console.error(error.stack);
      }
    }, 200); // Increased timeout for scene to be fully ready

    return () => clearTimeout(timeout);
  }, [scene, artworkCount, debug, options.rayDirections, options.heightSamples, options.minWallArea, options.verticalThreshold, options.minHeight, options.spacing, options.heightFromFloor, options.offsetFromWall]);

  return placements;
}
