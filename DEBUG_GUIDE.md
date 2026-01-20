# Animation Debug Guide

## Giới thiệu

File này hướng dẫn cách sử dụng các debug tools đã được thêm vào để giải quyết vấn đề T-pose khi nhân vật di chuyển.

## Debug Logs Tự Động

Các log sau sẽ tự động xuất hiện trong console khi chạy ứng dụng:

### 1. Player Movement Logs

- `🚶 [Player] Switching to WALK animation` - Khi nhân vật bắt đầu di chuyển
- `🧍 [Player] Switching to IDLE animation` - Khi nhân vật dừng lại

### 2. Character Model Logs

- `🎭 [CharacterModel3d] Component mounted` - Khi component được khởi tạo
- `📦 [CharacterModel3d] Available animations: [...]` - Danh sách animations có sẵn
- `🦴 [CharacterModel3d] Total bones found: X` - Số lượng bones trong skeleton

### 3. Animation State Changes

- `🔄 [CharacterModel3d] Animation state changed to: walk/idle`
- `▶️ [CharacterModel3d] Playing animation: "animation_name"`
- `⏹️ [CharacterModel3d] Stopping previous action: "animation_name"`
- `🎬 [CharacterModel3d] Action details:` - Chi tiết về animation đang chạy

### 4. T-Pose Detection

- `⚠️⚠️⚠️ T-POSE DETECTED! ⚠️⚠️⚠️` - Cảnh báo khi phát hiện T-pose
- Kèm theo thông tin về:
  - Animation state hiện tại
  - Action đang chạy
  - Trạng thái của arm bones

### 5. Procedural Animation (Fallback)

- `🤖 [Procedural Animation] Switching to walk/idle` - Khi sử dụng procedural animation
- `🤖 [Procedural] Animating X bones in WALK/IDLE mode` - Số lượng bones được animate

## Debug Tools Thủ Công

Mở browser console và sử dụng các lệnh sau:

### 1. Log toàn bộ bone hierarchy

```javascript
window.debugAnimation.logBones();
```

Hiển thị:

- Tên tất cả bones
- Rotation (x, y, z)
- Position của từng bone

### 2. Detect T-Pose

```javascript
window.debugAnimation.detectTPose();
```

Kiểm tra xem nhân vật có đang trong T-pose hay không

### 3. Tạo Snapshot

```javascript
// Tạo snapshot khi idle
window.debugAnimation.snapshot("idle_state");

// Di chuyển nhân vật, sau đó:
window.debugAnimation.snapshot("walk_state");
```

### 4. So sánh Snapshots

```javascript
window.debugAnimation.compare("idle_state", "walk_state");
```

Hiển thị sự khác biệt về rotation của bones giữa 2 trạng thái

### 5. Log Animation Actions

```javascript
window.debugAnimation.logActions();
```

Hiển thị:

- Tất cả actions có sẵn
- Trạng thái của từng action (running, weight, time)

## Workflow Debug Lỗi T-Pose

### Bước 1: Xác nhận vấn đề

1. Chạy ứng dụng
2. Mở browser console (F12)
3. Di chuyển nhân vật bằng WASD
4. Quan sát xem có cảnh báo `⚠️⚠️⚠️ T-POSE DETECTED!` không

### Bước 2: Thu thập thông tin

Khi phát hiện T-pose, kiểm tra:

```javascript
// 1. Kiểm tra animations có sẵn
window.debugAnimation.logActions();

// 2. Xem trạng thái bones
window.debugAnimation.logBones();

// 3. Tạo snapshots để so sánh
window.debugAnimation.snapshot("current_tpose");
```

### Bước 3: So sánh states

```javascript
// Khi idle (không T-pose)
window.debugAnimation.snapshot("good_idle");

// Khi walk (có T-pose)
window.debugAnimation.snapshot("bad_walk");

// So sánh
window.debugAnimation.compare("good_idle", "bad_walk");
```

### Bước 4: Phân tích kết quả

Kiểm tra console output để xác định:

1. **Animation không tìm thấy?**

   - Xem log: `⚠️ [CharacterModel3d] No walk animation found!`
   - Kiểm tra file GLB có chứa walk animation không
   - Xem tên animation có match với "walk", "run" không

2. **Action không running?**

   - Kiểm tra `isRunning: false` trong action details
   - Kiểm tra `weight: 0` (animation không có effect)

3. **Bones không được animate?**

   - So sánh rotation giữa idle và walk
   - Nếu không có sự khác biệt => animation không apply

4. **Conflict giữa animations?**
   - Kiểm tra có nhiều actions cùng running không
   - Xem fadeIn/fadeOut có hoạt động đúng không

## Nguyên nhân thường gặp

### 1. Animation name không match

```
❌ File GLB có animation tên "Walking" nhưng code tìm "walk"
✅ Đổi tên hoặc update matching logic
```

### 2. Animation weight = 0

```
❌ action.weight = 0 => animation không có effect
✅ Kiểm tra fadeIn() có được gọi đúng không
```

### 3. Multiple actions conflict

```
❌ Idle action vẫn running khi play walk action
✅ Đảm bảo fadeOut() được gọi cho previous action
```

### 4. Procedural animation override

```
❌ useFrame vẫn chạy mặc dù có GLB animations
✅ Kiểm tra điều kiện if (names.length > 0) return
```

### 5. Bone naming mismatch

```
❌ Code tìm "LeftArm" nhưng bone tên là "mixamorigLeftArm"
✅ Dùng .includes() thay vì ===
```

## Tips Debug

1. **Tắt procedural animation tạm thời**

   - Comment out toàn bộ useFrame procedural animation
   - Chỉ test với GLB animations

2. **Test từng animation riêng**

   ```javascript
   // Trong console
   Object.values(window.debugAnimation.actions).forEach((action) => {
     action.stop();
   });

   // Play 1 animation cụ thể
   window.debugAnimation.actions["Walk"].play();
   ```

3. **Kiểm tra mixer update**

   - AnimationMixer cần được update mỗi frame
   - useAnimations hook đã tự động làm điều này

4. **Clear cache**
   - Xóa cache browser
   - Reload hard (Ctrl+Shift+R)
   - Đảm bảo GLB file mới nhất được load

## Kết quả mong đợi

Sau khi fix:

- ✅ Không có warning T-pose trong console
- ✅ Nhân vật chuyển mượt giữa idle và walk
- ✅ Arms swing tự nhiên khi đi bộ
- ✅ Action details hiển thị isRunning: true, weight: 1

## Liên hệ

Nếu vẫn gặp vấn đề sau khi debug, thu thập:

1. Screenshot console logs
2. Output của `window.debugAnimation.logActions()`
3. Output của `window.debugAnimation.compare('idle', 'walk')`
4. Video ghi lại lỗi T-pose
