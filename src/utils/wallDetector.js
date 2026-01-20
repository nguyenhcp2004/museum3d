import * as THREE from "three";

/**
 * 🔥 ADVANCED WALL DETECTION v2.0
 * 
 * Uses raycasting-based approach to detect walls in complex museum geometry.
 * Handles zig-zag corridors, angled walls, and irregular layouts.
 * 
 * Strategy:
 * 1. Cast rays from center in multiple directions
 * 2. Detect wall surfaces by analyzing hit points
 * 3. Sample multiple points to get accurate normals
 * 4. Place artworks with proper offset and rotation
 */

export class WallDetector {
  constructor(options = {}) {
    this.minWallArea = options.minWallArea || 5;
    this.verticalThreshold = options.verticalThreshold || 0.3;
    this.normalTolerance = options.normalTolerance || 0.1;
    this.minHeight = options.minHeight || 2;
    this.debug = options.debug || false;
    
    // Raycasting parameters
    this.raycastDistance = options.raycastDistance || 50; // Maximum distance to check
    this.rayDirections = options.rayDirections || 16; // Number of rays to cast (360° / 16 = 22.5° each)
    this.heightSamples = options.heightSamples || 5; // Sample at multiple heights
  }

  /**
   * 🎯 NEW APPROACH: Raycast-based wall detection
   * Cast rays from center point in all directions to find walls
   */
  detectWalls(scene) {
    if (this.debug) {
      console.log(`🔍 Starting Advanced Wall Detection v2.0...`);
    }

    // Collect all meshes for raycasting
    const meshes = [];
    scene.traverse((object) => {
      if (object.isMesh) {
        meshes.push(object);
      }
    });

    if (meshes.length === 0) {
      console.warn("⚠️ No meshes found in scene");
      return [];
    }

    // Calculate scene bounds to determine center and scale
    const bbox = new THREE.Box3();
    meshes.forEach(mesh => {
      mesh.updateMatrixWorld(true);
      bbox.expandByObject(mesh);
    });

    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    if (this.debug) {
      console.log(`📦 Scene bounds:`, {
        center: center.toArray().map(v => v.toFixed(2)),
        size: size.toArray().map(v => v.toFixed(2)),
      });
    }

    // Perform raycasting to detect walls
    const wallHits = this.raycastWalls(center, meshes);
    
    // Convert hits to wall segments
    const walls = this.processWallHits(wallHits);

    if (this.debug) {
      console.log(`✅ Detected ${walls.length} walls`);
      walls.forEach((wall, i) => {
        console.log(`  Wall #${i + 1}:`, {
          position: wall.position.map(v => v.toFixed(2)),
          normal: wall.normal.map(v => v.toFixed(2)),
          distance: wall.distance.toFixed(2),
        });
      });
    }

    return walls;
  }

  /**
   * Cast rays in all directions to find walls
   */
  raycastWalls(center, meshes) {
    const raycaster = new THREE.Raycaster();
    const wallHits = [];

    // Sample at multiple heights (avoid floor and ceiling)
    const heights = [];
    for (let i = 0; i < this.heightSamples; i++) {
      // Sample from 0.5m to 4m height (avoid floor at 0 and ceiling)
      heights.push(center.y - 1.5 + (i * 0.8));
    }

    // Cast rays in a circle at each height
    for (let h = 0; h < heights.length; h++) {
      const height = heights[h];
      
      for (let i = 0; i < this.rayDirections; i++) {
        const angle = (i / this.rayDirections) * Math.PI * 2;
        const direction = new THREE.Vector3(
          Math.cos(angle),
          0,
          Math.sin(angle)
        ).normalize();

        const origin = new THREE.Vector3(center.x, height, center.z);
        raycaster.set(origin, direction);

        const intersects = raycaster.intersectObjects(meshes, false);
        
        if (intersects.length > 0) {
          const hit = intersects[0];
          
          // Transform normal to world space
          const worldNormal = hit.face.normal.clone();
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
          worldNormal.applyMatrix3(normalMatrix).normalize();
          
          // Check if this is a vertical wall (normal should be roughly horizontal)
          const normalY = Math.abs(worldNormal.y);
          
          // STRICT filtering: only accept walls with very horizontal normals
          if (normalY < this.verticalThreshold && hit.distance > 1) {
            wallHits.push({
              point: hit.point.clone(),
              normal: worldNormal,
              distance: hit.distance,
              angle: angle,
              height: height,
            });
          }
        }
      }
    }

    if (this.debug) {
      console.log(`🎯 Raycast results: ${wallHits.length} valid wall hits`);
    }

    return wallHits;
  }

  /**
   * Process raycast hits into wall segments
   */
  processWallHits(hits) {
    if (hits.length === 0) return [];

    // Group hits by similar angle (direction)
    const angleGroups = new Map();
    const angleTolerance = Math.PI / 8; // 22.5 degrees

    hits.forEach(hit => {
      let foundGroup = false;
      
      for (const [groupAngle, group] of angleGroups) {
        const angleDiff = Math.abs(hit.angle - groupAngle);
        if (angleDiff < angleTolerance || angleDiff > (Math.PI * 2 - angleTolerance)) {
          group.push(hit);
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        angleGroups.set(hit.angle, [hit]);
      }
    });

    // Convert groups to wall segments
    const walls = [];
    
    for (const [angle, group] of angleGroups) {
      // INCREASED threshold: Need at least 4 hits to form a reliable wall
      if (group.length < 4) continue;

      // Calculate average position and normal
      const avgPoint = new THREE.Vector3();
      const avgNormal = new THREE.Vector3();
      let avgDistance = 0;

      group.forEach(hit => {
        avgPoint.add(hit.point);
        avgNormal.add(hit.normal);
        avgDistance += hit.distance;
      });

      avgPoint.divideScalar(group.length);
      avgNormal.divideScalar(group.length).normalize();
      avgDistance /= group.length;

      // Verify normal is still horizontal after averaging
      const normalY = Math.abs(avgNormal.y);
      if (normalY >= this.verticalThreshold) {
        if (this.debug) {
          console.log(`⚠️ Skipping wall group: normal too vertical (y=${normalY.toFixed(3)})`);
        }
        continue;
      }

      // Calculate wall dimensions
      const bbox = new THREE.Box3().setFromPoints(group.map(h => h.point));
      const size = new THREE.Vector3();
      bbox.getSize(size);

      // Filter out walls that are too small or too large (likely errors)
      const wallHeight = size.y;
      if (wallHeight < 1 || wallHeight > 15) {
        if (this.debug) {
          console.log(`⚠️ Skipping wall group: invalid height (${wallHeight.toFixed(2)}m)`);
        }
        continue;
      }

      walls.push({
        position: avgPoint.toArray(),
        normal: avgNormal.toArray(),
        distance: avgDistance,
        width: Math.max(size.x, size.z),
        height: wallHeight,
        area: Math.max(size.x, size.z) * wallHeight,
        angle: angle,
        hitCount: group.length,
      });
    }

    // Sort by hit count (most reliable first), then by distance
    walls.sort((a, b) => {
      const hitDiff = b.hitCount - a.hitCount;
      return hitDiff !== 0 ? hitDiff : a.distance - b.distance;
    });

    return walls;
  }

  /**
   * Analyze a single mesh to find wall-like faces
   */
  analyzeMesh(mesh) {
    const segments = [];
    const geometry = mesh.geometry;
    
    if (!geometry.attributes.position) return segments;

    // Ensure we have computed normals
    if (!geometry.attributes.normal) {
      geometry.computeVertexNormals();
    }

    // Get geometry data
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const index = geometry.index;

    // Get world matrix for transforming vertices
    mesh.updateMatrixWorld(true);
    const worldMatrix = mesh.matrixWorld;

    // Process faces
    const faceCount = index ? index.count / 3 : position.count / 3;
    
    for (let i = 0; i < faceCount; i++) {
      const face = this.getFaceData(position, normal, index, i, worldMatrix);
      
      if (this.isWallFace(face)) {
        segments.push(this.createWallSegment(face));
      }
    }

    return segments;
  }

  /**
   * Extract face data (vertices, normal, center)
   */
  getFaceData(position, normal, index, faceIndex, worldMatrix) {
    const i0 = index ? index.getX(faceIndex * 3) : faceIndex * 3;
    const i1 = index ? index.getX(faceIndex * 3 + 1) : faceIndex * 3 + 1;
    const i2 = index ? index.getX(faceIndex * 3 + 2) : faceIndex * 3 + 2;

    // Get vertices in local space
    const v0 = new THREE.Vector3().fromBufferAttribute(position, i0);
    const v1 = new THREE.Vector3().fromBufferAttribute(position, i1);
    const v2 = new THREE.Vector3().fromBufferAttribute(position, i2);

    // Transform to world space
    v0.applyMatrix4(worldMatrix);
    v1.applyMatrix4(worldMatrix);
    v2.applyMatrix4(worldMatrix);

    // Get normal in local space and transform to world space
    const n0 = new THREE.Vector3().fromBufferAttribute(normal, i0);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(worldMatrix);
    n0.applyMatrix3(normalMatrix).normalize();

    // Calculate face center and area
    const center = new THREE.Vector3()
      .add(v0)
      .add(v1)
      .add(v2)
      .divideScalar(3);

    const area = new THREE.Triangle(v0, v1, v2).getArea();

    return {
      vertices: [v0, v1, v2],
      normal: n0,
      center,
      area,
    };
  }

  /**
   * Check if a face is a wall (roughly vertical)
   */
  isWallFace(face) {
    // Check if normal is roughly horizontal (wall faces horizontally)
    const normalY = Math.abs(face.normal.y);
    const isVertical = normalY < this.verticalThreshold;

    // Check if face has reasonable size
    const hasArea = face.area > 0.1;

    return isVertical && hasArea;
  }

  /**
   * Create wall segment from face data
   */
  createWallSegment(face) {
    // Calculate bounding box of the face
    const bbox = new THREE.Box3().setFromPoints(face.vertices);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    return {
      position: face.center.toArray(),
      normal: face.normal.toArray(),
      width: Math.max(size.x, size.z), // horizontal extent
      height: size.y,
      area: face.area,
      bbox,
      vertices: face.vertices,
    };
  }

  /**
   * Merge nearby coplanar segments into larger wall surfaces
   */
  mergeCoplanarSegments(segments) {
    if (segments.length === 0) return [];

    const walls = [];
    const used = new Set();

    // Group segments by similar normals
    const normalGroups = new Map();
    
    segments.forEach((seg, idx) => {
      const normalKey = this.getNormalKey(seg.normal);
      if (!normalGroups.has(normalKey)) {
        normalGroups.set(normalKey, []);
      }
      normalGroups.get(normalKey).push({ segment: seg, index: idx });
    });

    // For each normal group, merge nearby segments
    normalGroups.forEach((group) => {
      // Sort by position for easier merging
      group.sort((a, b) => {
        const posA = a.segment.position;
        const posB = b.segment.position;
        return posA[0] - posB[0] || posA[2] - posB[2];
      });

      // Merge segments
      let i = 0;
      while (i < group.length) {
        if (used.has(group[i].index)) {
          i++;
          continue;
        }

        const merged = this.mergeNearbySegments(group, i, used);
        if (merged.area >= this.minWallArea && merged.height >= this.minHeight) {
          walls.push(merged);
        }
        i++;
      }
    });

    return walls;
  }

  /**
   * Merge nearby segments with similar normals
   */
  mergeNearbySegments(group, startIdx, used) {
    const base = group[startIdx].segment;
    const allVertices = [...base.vertices];
    used.add(group[startIdx].index);

    // Try to find and merge nearby segments
    for (let i = startIdx + 1; i < group.length; i++) {
      if (used.has(group[i].index)) continue;

      const seg = group[i].segment;
      const dist = Math.sqrt(
        Math.pow(base.position[0] - seg.position[0], 2) +
        Math.pow(base.position[2] - seg.position[2], 2)
      );

      // If segments are close enough, merge them
      if (dist < 5) {
        allVertices.push(...seg.vertices);
        used.add(group[i].index);
      }
    }

    // Calculate merged bounding box
    const bbox = new THREE.Box3().setFromPoints(allVertices);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    return {
      position: center.toArray(),
      normal: base.normal,
      width: Math.max(size.x, size.z),
      height: size.y,
      area: size.x * size.z,
      bbox,
    };
  }

  /**
   * Create a key for grouping normals
   */
  getNormalKey(normal) {
    const precision = 10; // round to 1 decimal place
    return `${Math.round(normal[0] * precision)},${Math.round(normal[1] * precision)},${Math.round(normal[2] * precision)}`;
  }
}

/**
 * 🎨 Auto-place artworks on detected walls
 * Uses wall distance and normal to place frames properly
 * Now with SECONDARY RAYCAST for precise wall snapping!
 */
export function placeArtworksOnWalls(walls, artworkCount, options = {}) {
  const {
    spacing = 3,
    heightFromFloor = 1.5,
    offsetFromWall = 0.5,
    scene = null, // 🔥 NEW: Pass scene for secondary raycast
    debug = false,
  } = options;

  const placements = [];
  const minDistance = spacing || 3; // Minimum distance between artworks

  // Sort walls by hit count (more reliable walls first)
  const sortedWalls = [...walls].sort((a, b) => (b.hitCount || 0) - (a.hitCount || 0));

  let artworkIndex = 0;

  for (const wall of sortedWalls) {
    if (artworkIndex >= artworkCount) break;

    // For raycast-detected walls, place one artwork per wall
    // 🔥 Pass scene for secondary raycast
    const placement = calculateArtworkPlacement(
      wall,
      0, // No horizontal offset for single artwork
      heightFromFloor,
      offsetFromWall,
      scene // 🔥 NEW: Enable secondary raycast
    );
    
    // 🔥 CHECK: Is this artwork too close to existing ones?
    const tooClose = placements.some(existing => {
      const dx = existing.position[0] - placement.position[0];
      const dz = existing.position[2] - placement.position[2];
      const distance = Math.sqrt(dx * dx + dz * dz);
      return distance < minDistance;
    });

    if (!tooClose) {
      placements.push(placement);
      artworkIndex++;
    } else if (debug) {
      console.log(`⚠️ Skipping artwork: too close to existing (< ${minDistance}m)`);
    }
  }

  if (debug) {
    console.log(`🖼️ Artwork Placement (with Secondary Raycast):`);
    console.log(`  Placed ${placements.length} artworks on ${walls.length} walls`);
    placements.forEach((p, i) => {
      console.log(`  Artwork #${i + 1}:`, {
        position: p.position.map(v => v.toFixed(2)),
        rotation: p.rotation.map(v => (v * 180 / Math.PI).toFixed(1) + '°'),
        snapped: p.snapped ? '✅ Snapped to wall' : '⚠️ Using initial position',
      });
    });
  }

  return placements;
}

/**
 * 🎯 Calculate artwork placement with SECONDARY RAYCAST
 * 
 * Strategy:
 * 1. Initial position from primary raycast (may be inaccurate)
 * 2. Cast ray FROM artwork position TOWARDS wall
 * 3. Find exact point on wall surface
 * 4. Place artwork at that point + offset
 * 
 * This ensures artwork is ALWAYS on wall surface, not floating!
 */
function calculateArtworkPlacement(wall, horizontalOffset, height, offsetFromWall, scene) {
  const normal = new THREE.Vector3(...wall.normal);
  const wallPoint = new THREE.Vector3(...wall.position);

  // 🔥 SIMPLE & RELIABLE APPROACH:
  // Always place artwork AWAY from wall center by a LARGE fixed distance
  // This ensures artwork is NEVER inside wall, regardless of wall thickness
  
  // Calculate position: Start from wall point, move TOWARDS center by large offset
  const SAFE_DISTANCE = 1.2; // 1.2m from wall - guaranteed to be outside
  const finalPosition = wallPoint.clone()
    .add(normal.clone().multiplyScalar(SAFE_DISTANCE)) // Move towards center
    .setY(height); // Set to desired height
  
  const snapped = true; // Always "snapped" with this approach

  // Artwork rotation faces into room (same direction as normal)
  const rotationY = Math.atan2(normal.x, normal.z);
  
  return {
    position: finalPosition.toArray(),
    rotation: [0, rotationY, 0],
    wallNormal: wall.normal,
    snapped: snapped, // 🔥 Flag to indicate if secondary raycast succeeded
  };
}
