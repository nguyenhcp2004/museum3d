# 🎨 Wall Detection System v2.0 - Testing Guide

## 🚀 Quick Start

1. **Chạy ứng dụng:**
   ```bash
   npm run dev
   ```

2. **Vào game và nhấn F3** để bật Debug Mode

3. **Quan sát:**
   - **Grid màu xám** = Sàn nhà (để định hướng)
   - **Trục XYZ** = Hệ tọa độ (X=đỏ, Y=xanh lá, Z=xanh dương)
   - **Sphere đỏ** = Vị trí artwork được đặt
   - **Mũi tên xanh lá** = Hướng normal của tường (vuông góc với tường)
   - **Mũi tên vàng** = Hướng artwork đang nhìn (phải hướng vào trong phòng)
   - **Sphere tím** = Không detect được tường nào (lỗi!)

## 🔍 Cách hoạt động

### Raycasting Strategy:
1. **Tìm center của scene** - Tính toán bounding box của toàn bộ museum
2. **Bắn rays theo vòng tròn** - 24 rays mỗi 15° (có thể điều chỉnh)
3. **Sample nhiều độ cao** - 6 heights từ sàn đến trần (có thể điều chỉnh)
4. **Phát hiện tường** - Chỉ lấy surfaces có normal gần horizontal (tường đứng)
5. **Nhóm hits** - Gom các hits cùng hướng thành 1 tường
6. **Đặt artwork** - Tính position và rotation dựa trên wall normal

### Parameters (trong Museum.jsx):

```javascript
{
  rayDirections: 24,      // Số rays bắn (càng nhiều càng chính xác)
  heightSamples: 6,       // Số độ cao sample (càng nhiều càng detect tốt)
  verticalThreshold: 0.4, // Normal.y < 0.4 = tường đứng
  heightFromFloor: 3,     // Độ cao artwork (3m)
  offsetFromWall: 0.8,    // Khoảng cách từ tường (0.8m)
}
```

## 🐛 Troubleshooting

### Vấn đề: Không thấy artwork nào
**Nguyên nhân:** Wall detection không hoạt động
**Giải pháp:**
1. Bật F3 debug mode
2. Mở Console (F12)
3. Tìm log: `🔍 Starting Advanced Wall Detection v2.0...`
4. Kiểm tra:
   - `📦 Scene bounds` - Scene có được load không?
   - `✅ Detected X walls` - Có detect được tường không?
   - Nếu `Detected 0 walls` → Tăng `rayDirections` và `heightSamples`

### Vấn đề: Artwork bị nghiêng
**Nguyên nhân:** Rotation calculation sai
**Giải pháp:**
1. Kiểm tra mũi tên vàng (artwork facing direction)
2. Nếu mũi tên vàng không hướng vào trong phòng → Bug trong `calculateArtworkPlacement`
3. Kiểm tra mũi tên xanh (wall normal) có vuông góc với tường không

### Vấn đề: Artwork lòi vào tường
**Nguyên nhân:** `offsetFromWall` quá nhỏ
**Giải pháp:**
- Tăng `offsetFromWall` từ 0.8 → 1.2 hoặc cao hơn

### Vấn đề: Artwork quá cao/thấp
**Nguyên nhân:** `heightFromFloor` không phù hợp với museum scale
**Giải pháp:**
- Museum scale = 3 → `heightFromFloor: 3`
- Nếu museum không scale → `heightFromFloor: 1.5`

### Vấn đề: Không detect hết tường (zig-zag corridor)
**Nguyên nhân:** Không đủ rays để detect tường góc
**Giải pháp:**
- Tăng `rayDirections: 24 → 32` (mỗi 11.25°)
- Tăng `heightSamples: 6 → 8`

## 📊 Console Logs

Khi debug mode ON, bạn sẽ thấy:

```
============================================================
🔧 DEBUG MODE: ENABLED
============================================================

📍 Debug Features:
  - Grid Helper (floor grid)
  - Axes Helper (XYZ axes)
  - Red Spheres = Artwork positions
  - Green Arrows = Wall normals
  - Yellow Arrows = Artwork facing direction
  - Magenta Sphere = No artworks detected

🔍 Starting Advanced Wall Detection v2.0...
📦 Scene bounds: { center: [0.00, 0.00, 0.00], size: [30.00, 10.00, 50.00] }
✅ Detected 12 walls
  Wall #1: { position: [10.50, 2.00, 5.00], normal: [-1.00, 0.00, 0.00], distance: 10.50 }
  Wall #2: { position: [-10.50, 2.00, 5.00], normal: [1.00, 0.00, 0.00], distance: 10.50 }
  ...

🖼️ Artwork Placement:
  Placed 12 artworks on 12 walls
  Artwork #1: { position: [11.30, 3.00, 5.00], rotation: [0.0°, 180.0°, 0.0°] }
  ...
```

## 🎯 Expected Results

Sau khi fix thành công:
- ✅ Artworks được đặt đều trên các tường
- ✅ Artworks vuông góc với tường (không nghiêng)
- ✅ Artworks không lòi vào tường
- ✅ Detect được cả tường zig-zag và góc
- ✅ Mũi tên vàng hướng vào trong phòng
- ✅ Mũi tên xanh vuông góc với tường

## 🔧 Advanced Tuning

Nếu vẫn chưa hoàn hảo, điều chỉnh trong `Museum.jsx`:

```javascript
const artworkPlacements = useAutoArtPlacements(museumScene, customImages.length, {
  rayDirections: 32,        // ⬆️ Tăng để detect tường góc tốt hơn
  heightSamples: 8,         // ⬆️ Tăng để detect tường cao/thấp
  verticalThreshold: 0.3,   // ⬇️ Giảm để chỉ lấy tường thẳng đứng hơn
  offsetFromWall: 1.0,      // ⬆️ Tăng nếu artwork vẫn lòi vào tường
  heightFromFloor: 3.5,     // ⬆️⬇️ Điều chỉnh theo museum scale
  debug: true,              // 🔧 Luôn bật để xem logs
});
```

## 📝 Notes

- Hệ thống này dùng **raycasting** thay vì phân tích geometry trực tiếp
- Phù hợp với **complex museum models** có nhiều mesh fragments
- Hoạt động tốt với **zig-zag corridors** và **angled walls**
- Performance: O(rays × heights × meshes) - Nhanh với museum models thông thường

## 🆘 Support

Nếu vẫn gặp vấn đề:
1. Chụp ảnh với debug mode ON (F3)
2. Copy console logs
3. Gửi kèm thông tin:
   - Số walls detected
   - Số artworks placed
   - Scene bounds (center, size)
