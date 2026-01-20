import { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Vector3, Euler, Quaternion, Raycaster } from "three";
import { useStore } from "../../stores/useStore";
import { CharacterModel3d } from "./CharacterModel3d";

const SPEED = 5;

export function Player() {
  const { camera, scene } = useThree();
  const { isLocked, setIsLocked, setInteractionData } = useStore();

  // Controls state
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const moveJump = useRef(false);
  const raycaster = useRef(new Raycaster());
  const wallsRef = useRef([]);
  const artworksRef = useRef([]);

  // Update collidable objects and artworks list
  useEffect(() => {
    if (!scene) return;
    const updateObjects = () => {
      const collidables = [];
      const artworks = [];
      
      scene.traverse((obj) => {
        // Collect collidable walls
        if (
          obj.isMesh &&
          (obj.name === "col-wall" || obj.userData.isCollidable)
        ) {
          collidables.push(obj);
        }
        
        // Collect artwork meshes (both frame and image)
        if (obj.isMesh && obj.userData.isArtwork) {
          artworks.push(obj);
        }
        
        // Also collect groups that might be artworks
        if (obj.isGroup && obj.children.some(child => child.userData?.isArtwork)) {
          artworks.push(obj);
        }
      });
      
      wallsRef.current = collidables;
      artworksRef.current = artworks;
      
      console.log(`🔍 Found ${collidables.length} collidable objects, ${artworks.length} artworks`);

      // Debug: log first 5 objects to verify
      if (collidables.length > 0) {
        console.log(
          "Sample collidables:",
          collidables.slice(0, 5).map((obj) => ({
            name: obj.name || "unnamed",
            type: obj.type,
            position: `(${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(
              1
            )}, ${obj.position.z.toFixed(1)})`,
            hasUserData: !!obj.userData.isCollidable,
          }))
        );
      }
      
      if (artworks.length > 0) {
        console.log(`🎨 Found ${artworks.length} artwork objects for click detection`);
      }
    };
    updateObjects();
    // Update objects periodically to catch new objects
    const interval = setInterval(updateObjects, 5000);
    return () => clearInterval(interval);
  }, [scene]);

  // Character state
  const position = useRef(new Vector3(0, 0, 5));
  const velocity = useRef(new Vector3(0, 0, 0));
  const isGrounded = useRef(true);
  const [animationState, setAnimationState] = useState("idle");
  const characterRef = useRef();
  const prevAnimationState = useRef("idle");

  // Camera State
  // We track camera spherical coordinates (phi, theta)
  const cameraRotation = useRef(new Vector3(0, 0, 0)); // x=pitch, y=yaw, z=dummy
  const CAMERA_DIST = 10;
  const CAMERA_HEIGHT = 6;

  useEffect(() => {
    const onKeyDown = (event) => {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          moveForward.current = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          moveLeft.current = true;
          break;
        case "ArrowDown":
        case "KeyS":
          moveBackward.current = true;
          break;
        case "ArrowRight":
        case "KeyD":
          moveRight.current = true;
          break;
        case "Space":
          moveJump.current = true;
          break;
      }
    };
    const onKeyUp = (event) => {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          moveForward.current = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          moveLeft.current = false;
          break;
        case "ArrowDown":
        case "KeyS":
          moveBackward.current = false;
          break;
        case "ArrowRight":
        case "KeyD":
          moveRight.current = false;
          break;
        case "Space":
          moveJump.current = false;
          break;
      }
    };
    const onClick = (event) => {
      console.log('🖱️ Click detected!', {
        isLocked,
        target: event.target.tagName,
        pointerLocked: !!document.pointerLockElement
      });
      
      // If pointer is locked, check for artwork clicks using raycasting
      if (isLocked && document.pointerLockElement) {
        console.log('🎯 Raycasting from camera center to detect artwork...');
        console.log('   Camera position:', camera.position.toArray().map(v => v.toFixed(2)));
        console.log('   Camera rotation:', camera.rotation.toArray().slice(0, 3).map(v => v.toFixed(2)));
        
        // Raycast from camera center (where reticle is)
        raycaster.current.setFromCamera({ x: 0, y: 0 }, camera);
        raycaster.current.far = 50; // Increase far distance to 50m
        
        console.log('   Raycaster origin:', raycaster.current.ray.origin.toArray().map(v => v.toFixed(2)));
        console.log('   Raycaster direction:', raycaster.current.ray.direction.toArray().map(v => v.toFixed(2)));
        console.log('   Raycaster far:', raycaster.current.far);
        
        // Check all objects in scene recursively
        const allIntersects = raycaster.current.intersectObjects(scene.children, true);
        
        console.log(`   Found ${allIntersects.length} intersections total`);
        
        if (allIntersects.length > 0) {
          // Log first 5 intersections
          console.log('   First 5 intersections:');
          allIntersects.slice(0, 5).forEach((intersect, i) => {
            console.log(`   ${i + 1}. ${intersect.object.name || 'unnamed'} at ${intersect.distance.toFixed(2)}m`, {
              type: intersect.object.type,
              isArtwork: intersect.object.userData?.isArtwork,
              hasArtworkData: !!intersect.object.userData?.artworkData,
              isCollidable: intersect.object.userData?.isCollidable,
              parent: intersect.object.parent?.type
            });
          });
          
          // Find first artwork in intersections
          const artworkHit = allIntersects.find(intersect => {
            // Check if this mesh has artwork data
            return intersect.object.userData?.isArtwork && 
                   intersect.object.userData?.artworkData;
          });
          
          if (artworkHit) {
            const artworkData = artworkHit.object.userData.artworkData;
            console.log('🎨 ========== HIT ARTWORK! ==========');
            console.log('   Object:', artworkHit.object.name || 'unnamed');
            console.log('   Distance:', artworkHit.distance.toFixed(2) + 'm');
            console.log('   Title:', artworkData.title);
            console.log('=====================================');
            
            console.log('✅ Opening artwork popup:', artworkData.title);
            
            // Import textToSpeech functions
            import('../../utils/textToSpeech').then(({ speakText, stopSpeaking }) => {
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
            });
            
            return; // Don't request pointer lock
          } else {
            console.log('   ⚠️ No artwork with data found in intersections');
          }
        } else {
          console.log('   ⚠️ Raycaster found nothing - check camera position and artwork positions');
        }
      }
      
      // Only request pointer lock if clicking on canvas and not locked
      if (!isLocked && event.target.tagName === 'CANVAS') {
        console.log('🔒 Requesting pointer lock...');
        document.querySelector("canvas").requestPointerLock();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("click", onClick);

    const onLockChange = () =>
      setIsLocked(document.pointerLockElement !== null);
    document.addEventListener("pointerlockchange", onLockChange);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
  }, [isLocked, setIsLocked]);

  const onMouseMove = (event) => {
    if (!isLocked) return;
    // Mouse controls Camera Rotation (Orbit)
    // Yaw (Y-axis rotation)
    cameraRotation.current.y -= event.movementX * 0.002;
    // Pitch (X-axis rotation) - Clamp to avoid flipping
    cameraRotation.current.x -= event.movementY * 0.002;
    cameraRotation.current.x = Math.max(
      -0.5,
      Math.min(1.0, cameraRotation.current.x)
    );
  };

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, [isLocked]);

  useFrame((state, delta) => {
    // 1. Calculate Camera Position based on Rotation around Player
    // We orbit around target (position.current + height)
    const target = position.current.clone().add(new Vector3(0, 1.5, 0));

    // Convert spherical to cartesian offset
    const cx =
      Math.sin(cameraRotation.current.y) *
      Math.cos(cameraRotation.current.x) *
      CAMERA_DIST;
    const cz =
      Math.cos(cameraRotation.current.y) *
      Math.cos(cameraRotation.current.x) *
      CAMERA_DIST;
    const cy = Math.sin(cameraRotation.current.x) * CAMERA_DIST + CAMERA_HEIGHT;

    // Camera is placed relative to target
    const idealCamPos = target.clone().add(new Vector3(cx, cy, cz));
    camera.position.lerp(idealCamPos, 0.2); // Smooth follow
    camera.lookAt(target);

    // 2. Character Movement
    // Move relative to Camera YAW (ignore pitch)
    const forward = moveForward.current ? 1 : 0;
    const backward = moveBackward.current ? 1 : 0;
    const left = moveLeft.current ? 1 : 0;
    const right = moveRight.current ? 1 : 0;

    const direction = new Vector3();
    // W moves towards camera View Direction (but flat on ground)
    // Calculating forward vector from camera yaw
    const camForward = new Vector3(
      -Math.sin(cameraRotation.current.y),
      0,
      -Math.cos(cameraRotation.current.y)
    ).normalize();
    const camRight = new Vector3(
      -Math.sin(cameraRotation.current.y - Math.PI / 2),
      0,
      -Math.cos(cameraRotation.current.y - Math.PI / 2)
    ).normalize();

    // Combine inputs
    // W = +camForward, S = -camForward
    // D = +camRight, A = -camRight
    if (forward) direction.add(camForward);
    if (backward) direction.sub(camForward);
    if (right) direction.add(camRight);
    if (left) direction.sub(camRight);

    direction.normalize();

    // 3. Apply Movement
    if (direction.length() > 0.1) {
      // Character is moving
      if (animationState !== "walk") {
        setAnimationState("walk");
      }

      // Predict next position
      const moveVector = direction.clone().multiplyScalar(SPEED * delta);
      const nextPosition = position.current.clone().add(moveVector);

      // IMPROVED COLLISION DETECTION: Raycast only (no sphere)
      const checkDistance = 0.6; // Check distance ahead
      let hasCollision = false;
      let collisionInfo = null;

      // Raycast at multiple heights and angles
      const checkAngles = [0, Math.PI / 8, -Math.PI / 8]; // center, 22.5° left, 22.5° right
      const checkHeights = [0.5, 1.0, 1.5]; // Low, medium, high

      for (let height of checkHeights) {
        for (let angle of checkAngles) {
          const rayOrigin = position.current
            .clone()
            .add(new Vector3(0, height, 0));
          const checkDir = direction.clone();
          // Rotate direction by angle
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const x = checkDir.x * cos - checkDir.z * sin;
          const z = checkDir.x * sin + checkDir.z * cos;
          checkDir.x = x;
          checkDir.z = z;
          checkDir.normalize();

          raycaster.current.set(rayOrigin, checkDir);
          raycaster.current.far = checkDistance;

          const intersects = raycaster.current.intersectObjects(
            wallsRef.current,
            true
          );

          if (intersects.length > 0 && intersects[0].distance < checkDistance) {
            hasCollision = true;
            collisionInfo = {
              method: "raycast",
              object: intersects[0].object.name || "unnamed",
              distance: intersects[0].distance.toFixed(2),
              height: height,
              angle: ((angle * 180) / Math.PI).toFixed(0),
            };
            break;
          }
        }
        if (hasCollision) break;
      }

      if (hasCollision) {
        // Hit obstacle - Stop movement
        console.log(
          `🚫 COLLISION! Method: ${collisionInfo.method}, Object: ${collisionInfo.object}, Distance: ${collisionInfo.distance}m, Height: ${collisionInfo.height}m, Angle: ${collisionInfo.angle}°`
        );
      } else {
        position.current.add(moveVector);
      }

      // Rotate character to face movement direction
      const targetRotation = Math.atan2(direction.x, direction.z);
      // Smooth rotation
      let rotDiff = targetRotation - characterRef.current.rotation.y;
      // Normalize angle to -PI..PI
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      characterRef.current.rotation.y += rotDiff * 0.2;
    } else {
      // Not moving => idle
      if (animationState !== "idle") {
        setAnimationState("idle");
      }
      velocity.current.set(0, 0, 0);
    }

    // 4. Jumping & Gravity
    // Apply Gravity
    velocity.current.y -= 25 * delta; // Gravity
    position.current.y += velocity.current.y * delta;

    // Ground Check (Floor at y=0)
    if (position.current.y < 0) {
      position.current.y = 0;
      velocity.current.y = 0;
      isGrounded.current = true;
    } else {
      isGrounded.current = false;
    }

    // Jump Input
    if (moveJump.current && isGrounded.current) {
      velocity.current.y = 8; // Jump Force
      isGrounded.current = false;
      // Maybe set animation to 'jump'? (If available)
    }

    // Apply visual position
    if (characterRef.current) {
      characterRef.current.position.copy(position.current);
    }
  });

  return (
    <group ref={characterRef}>
      <CharacterModel3d animationState={animationState} />
    </group>
  );
}
