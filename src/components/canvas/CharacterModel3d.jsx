import { useRef, useEffect } from "react";
import { useGLTF, useAnimations, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { SRGBColorSpace, MeshStandardMaterial } from "three";

export function CharacterModel3d({ animationState = "idle" }) {
  const group = useRef();
  const { scene, animations } = useGLTF(
    "/animations/3d-character-young-boy/source/saeedd.glb"
  );
  const { actions, names } = useAnimations(animations, group);

  // Lưu rotation ban đầu của tay
  const initialArmRotations = useRef({});

  // LOAD ALL TEXTURES MANUALLY
  const textures = useTexture({
    body: "/animations/3d-character-young-boy/textures/body_texture_2.jpeg",
    face: "/animations/3d-character-young-boy/textures/face_texture_5.jpeg",
    hair: "/animations/3d-character-young-boy/textures/hair_color_4.jpeg",
    outfitTop:
      "/animations/3d-character-young-boy/textures/outfit-m-office-02-v2-top-D_12.jpeg",
    outfitBottom:
      "/animations/3d-character-young-boy/textures/outfit-m-office-02-v2-bottom-D_7.jpeg",
    outfitShoes:
      "/animations/3d-character-young-boy/textures/outfit-m-office-02-v2-footwear-D_10.jpeg",
    teeth: "/animations/3d-character-young-boy/textures/Wolf3D_Teeth_13.jpeg",
    eyes: "/animations/3d-character-young-boy/textures/1622793658-eye-01-mask_0.jpeg",
  });

  // Fix texture encoding
  Object.values(textures).forEach((t) => {
    t.colorSpace = SRGBColorSpace;
    t.flipY = false;
  });

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // HEURISTIC MATERIAL MAPPING
        const name = child.name.toLowerCase();

        if (name.includes("body")) child.material.map = textures.body;
        if (name.includes("head") || name.includes("face"))
          child.material.map = textures.face;
        if (name.includes("hair")) {
          child.material.map = textures.hair;
          child.material.transparent = true; // Hair often needs transparency
        }
        if (name.includes("top") || name.includes("shirt"))
          child.material.map = textures.outfitTop;
        if (name.includes("bottom") || name.includes("pant"))
          child.material.map = textures.outfitBottom;
        if (name.includes("shoe") || name.includes("foot"))
          child.material.map = textures.outfitShoes;
        if (name.includes("teeth")) child.material.map = textures.teeth;
        if (name.includes("eye")) child.material.map = textures.eyes;

        if (child.material.map) {
          child.material.needsUpdate = true;
        }
      }

      // Lưu rotation ban đầu của tay CHỈ 1 LẦN DUY NHẤT
      if (child.isBone) {
        const name = child.name.toLowerCase();
        if (name.includes("arm") && !name.includes("forearm")) {
          // Chỉ lưu nếu chưa có trong initialArmRotations
          if (!initialArmRotations.current[child.name]) {
            initialArmRotations.current[child.name] = {
              x: child.rotation.x,
              y: child.rotation.y,
              z: child.rotation.z,
            };
          }
        }
      }
    });
  }, [scene, textures]);

  useEffect(() => {
    let action;
    if (animationState === "walk") {
      const walkName = names.find(
        (n) =>
          n.toLowerCase().includes("walk") || n.toLowerCase().includes("run")
      );
      action = actions[walkName] || actions[names[1]] || actions[names[0]]; // Hard fallback to index 0
    } else {
      const idleName = names.find(
        (n) =>
          n.toLowerCase().includes("idle") || n.toLowerCase().includes("stand")
      );
      action = actions[idleName] || actions[names[0]];
    }

    if (action) {
      action.reset().fadeIn(0.2).play();
      return () => action.fadeOut(0.2);
    }
  }, [animationState, actions, names]);

  // PROCEDURAL ANIMATION FALLBACK
  // If no GLB animations exist, we animate bones manually based on names
  useFrame(({ clock }) => {
    if (names.length > 0) return; // Use real animations if available

    const t = clock.getElapsedTime() * 10; // Speed
    const isWalking = animationState === "walk";

    // DEBUG FLAG - chỉ log mỗi 2 giây
    const shouldLog = Math.floor(t) % 2 === 0 && Math.floor((t % 1) * 10) === 0;

    scene.traverse((child) => {
      if (child.isBone) {
        const name = child.name.toLowerCase();

        // Simple sine wave limb rotation
        if (isWalking) {
          // Left Leg
          if (
            name.includes("leg") &&
            (name.includes("l") || name.includes("left")) &&
            !name.includes("low")
          ) {
            child.rotation.x = Math.sin(t) * 0.5;
          }
          // Right Leg
          if (
            name.includes("leg") &&
            (name.includes("r") || name.includes("right")) &&
            !name.includes("low")
          ) {
            child.rotation.x = Math.sin(t + Math.PI) * 0.5;
          }

          // Arms - Thu hẹp độ rộng tay + Swing animation
          const isLeftArm = child.name === "LeftArm";
          const isRightArm = child.name === "RightArm";

          if (isLeftArm || isRightArm) {
            const savedRotation = initialArmRotations.current[child.name];
            if (savedRotation) {
              // THU HẸP ĐỘ RỘNG TAY
              // savedZ điều khiển góc dang ngang (Left=-0.144, Right=+0.144)
              // Nhân với hệ số nhỏ hơn 1 để khép tay lại
              const ARM_WIDTH_FACTOR = 0.01; // 0.3 = gần người, 1.0 = giữ nguyên
              const adjustedSavedZ = savedRotation.z * ARM_WIDTH_FACTOR;

              // SWING ANIMATION khi đi
              const phase = 0; // Cùng phase vì model đã mirrored
              const swingAmount = Math.sin(t + phase) * 0.5;

              // Apply rotation
              child.rotation.x = savedRotation.x;
              child.rotation.y = savedRotation.y;
              child.rotation.z = adjustedSavedZ + swingAmount;
            }
          }
        } else {
          // Idle - khôi phục với width adjustment
          const isLeftArm = child.name === "LeftArm";
          const isRightArm = child.name === "RightArm";

          if (isLeftArm || isRightArm) {
            const savedRotation = initialArmRotations.current[child.name];
            if (savedRotation) {
              const ARM_WIDTH_FACTOR = 0.3;
              child.rotation.x = savedRotation.x;
              child.rotation.y = savedRotation.y;
              child.rotation.z = savedRotation.z * ARM_WIDTH_FACTOR;
            }
          }
        }
      }
    });
  });

  return (
    <group ref={group} dispose={null}>
      <primitive
        object={scene}
        scale={2.5}
        position={[0, -5.2, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload("/animations/3d-character-young-boy/source/saeedd.glb");
