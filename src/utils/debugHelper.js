/**
 * Debug Helper Utilities for Animation Debugging
 */

export class AnimationDebugger {
  constructor() {
    this.logInterval = 2000; // Log every 2 seconds
    this.lastLog = 0;
    this.boneSnapshots = new Map();
  }

  /**
   * Log bone hierarchy and rotations
   */
  logBoneHierarchy(scene, prefix = "") {
    console.group(`🦴 ${prefix}Bone Hierarchy`);

    let boneCount = 0;
    const bones = [];

    scene.traverse((child) => {
      if (child.isBone) {
        boneCount++;
        const boneData = {
          name: child.name,
          position: child.position.toArray(),
          rotation: child.rotation.toArray(),
          quaternion: child.quaternion.toArray(),
          scale: child.scale.toArray(),
        };
        bones.push(boneData);

        console.log(`  Bone #${boneCount}: ${child.name}`);
        console.log(
          `    Rotation (x,y,z):`,
          child.rotation.x.toFixed(3),
          child.rotation.y.toFixed(3),
          child.rotation.z.toFixed(3)
        );
        console.log(
          `    Position:`,
          child.position.toArray().map((v) => v.toFixed(3))
        );
      }
    });

    console.log(`Total bones: ${boneCount}`);
    console.groupEnd();

    return bones;
  }

  /**
   * Take a snapshot of current bone states
   */
  snapshotBones(scene, label) {
    const bones = [];
    scene.traverse((child) => {
      if (child.isBone) {
        bones.push({
          name: child.name,
          rotation: child.rotation.clone(),
          position: child.position.clone(),
          quaternion: child.quaternion.clone(),
        });
      }
    });

    this.boneSnapshots.set(label, bones);
    console.log(`📸 Snapshot "${label}" taken: ${bones.length} bones`);
    return bones;
  }

  /**
   * Compare two bone snapshots
   */
  compareBoneSnapshots(label1, label2) {
    const snapshot1 = this.boneSnapshots.get(label1);
    const snapshot2 = this.boneSnapshots.get(label2);

    if (!snapshot1 || !snapshot2) {
      console.error(`❌ Snapshots not found: ${label1}, ${label2}`);
      return;
    }

    console.group(`🔍 Comparing "${label1}" vs "${label2}"`);

    snapshot1.forEach((bone1, index) => {
      const bone2 = snapshot2[index];
      if (!bone2) return;

      const rotDiff = {
        x: Math.abs(bone1.rotation.x - bone2.rotation.x),
        y: Math.abs(bone1.rotation.y - bone2.rotation.y),
        z: Math.abs(bone1.rotation.z - bone2.rotation.z),
      };

      const hasDifference =
        rotDiff.x > 0.01 || rotDiff.y > 0.01 || rotDiff.z > 0.01;

      if (hasDifference) {
        console.log(`  ${bone1.name}:`);
        console.log(`    Rotation diff (rad):`, rotDiff);
        console.log(
          `    ${label1}:`,
          bone1.rotation.toArray().map((v) => v.toFixed(3))
        );
        console.log(
          `    ${label2}:`,
          bone2.rotation.toArray().map((v) => v.toFixed(3))
        );
      }
    });

    console.groupEnd();
  }

  /**
   * Monitor animation mixer and actions
   */
  logMixerState(mixer, actions) {
    console.group("🎬 Animation Mixer State");
    console.log("Mixer time:", mixer.time.toFixed(2));
    console.log("Mixer timeScale:", mixer.timeScale);

    Object.entries(actions).forEach(([name, action]) => {
      console.log(`  Action "${name}":`);
      console.log(`    isRunning: ${action.isRunning()}`);
      console.log(`    paused: ${action.paused}`);
      console.log(`    weight: ${action.weight.toFixed(3)}`);
      console.log(`    time: ${action.time.toFixed(2)}`);
      console.log(`    timeScale: ${action.timeScale}`);
    });

    console.groupEnd();
  }

  /**
   * Check if bones are in T-pose
   */
  detectTPose(scene) {
    const armBones = [];

    scene.traverse((child) => {
      if (child.isBone) {
        const name = child.name.toLowerCase();

        // Check for arm bones
        if (name.includes("arm") || name.includes("shoulder")) {
          armBones.push({
            name: child.name,
            rotation: child.rotation.clone(),
            rotationDeg: {
              x: ((child.rotation.x * 180) / Math.PI).toFixed(1),
              y: ((child.rotation.y * 180) / Math.PI).toFixed(1),
              z: ((child.rotation.z * 180) / Math.PI).toFixed(1),
            },
          });
        }
      }
    });

    // T-pose detection: arms extended roughly horizontally
    const isTPose = armBones.some((bone) => {
      const absZ = Math.abs(bone.rotation.z);
      const absX = Math.abs(bone.rotation.x);
      // If arm is extended to side (Z rotation ~90deg) and not bent (X ~0)
      return absZ > 1.2 && absZ < 2.0 && absX < 0.5;
    });

    if (isTPose) {
      console.warn("⚠️ T-POSE DETECTED!");
      console.log("Arm bones state:", armBones);
    }

    return { isTPose, armBones };
  }

  /**
   * Throttled logging
   */
  shouldLog(now) {
    if (now - this.lastLog > this.logInterval) {
      this.lastLog = now;
      return true;
    }
    return false;
  }
}

// Singleton instance
export const animationDebugger = new AnimationDebugger();
