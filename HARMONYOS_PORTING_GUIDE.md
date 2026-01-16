
# 像素猴 (Pixel Monkey) 鸿蒙原生移植详细指南

本指南旨在帮助开发者将本项目最快速度移植到 **HarmonyOS ArkTS + ArkUI** 环境，并保持 1:1 的视觉一致性。

## 1. 核心映射表 (Web to ArkUI)

### 1.1 基础布局
- **HTML Container** -> `Column` / `Row`
- **Flex-1** -> `layoutWeight(1)`
- **Overflow-Hidden** -> `clip(true)`
- **Z-Index** -> `zIndex()`

### 1.2 材质与阴影 (UI 核心)
像素猴的复古感来源于“硬阴影”和“内阴影”。
- **外阴影 (Box Shadow)**: 使用 `.shadow({ radius: 0, color: '#1a1a1a', offsetX: 4, offsetY: 4 })`。注意 `radius` 设为 0 以模拟像素风格。
- **内阴影 (Inset Shadow)**: ArkUI 无直接 `inset shadow`，需使用 `Stack` 叠加。

## 2. UI 资源获取 (开发者导出工具)
为了最快速度完成移植，应用内置了 **UI Asset Exporter (资源导出工具)**：

1. **进入工具**:
   - 打开编辑页面 -> 点击右上角“更多 (More)”按钮 -> 点击“配置 (Config)” -> 点击 **“导出 UI 资源 (EXPORT UI ASSETS)”**。
2. **导出 PNG**:
   - 工具会按主题列出：按钮 (Buttons)、面板 (Panels)、标签 (Tags)、LED 灯以及 CRT 纹理。
   - 点击组件旁边的 **“EXPORT PNG”**，即可将对应的 CSS 渲染结果保存为高清 PNG 图片。
3. **在鸿蒙中使用**:
   - 将导出的 PNG 放入鸿蒙项目的 `resources/base/media` 文件夹。
   - 按钮素材建议配置为“切片图片 (Slice Image)”以支持自适应缩放。

## 3. 关键组件移植实现

### 3.1 画布 (Canvas)
- **ArkTS 核心**:
  ```typescript
  Canvas(this.context)
    .width('100%')
    .aspectRatio(1)
    .onReady(() => {
       // 绘制逻辑
    })
    .imageSmoothingEnabled(false) // 必须关闭平滑
  ```

### 3.2 手势交互 (Zoom & Pan)
- 使用 `GestureGroup(GestureMode.Parallel)`。
- `PinchGesture`: 控制 `scaleX` 和 `scaleY`。
- `PanGesture`: 控制 `offsetX` 和 `offsetY`。

## 4. 存储迁移
- **Web**: `localStorage.getItem`
- **HarmonyOS**: `preferences.getPreferences` (用户首选项)
- 序列化方式一致：均使用 JSON 字符串存储。

## 5. 开发者快速 CheckList
- [ ] 在编辑器的配置菜单中启动 **Asset Exporter** 获取全套 UI 素材。
- [ ] 将导出的 **CRT 纹理** 作为全屏遮罩图片，设置透明度为 10%~20%。
- [ ] 按钮点击态建议在 ArkUI 中通过 `.opacity(0.8)` 或更换按下的背景图实现。
- [ ] 确保在鸿蒙中开启 `imageSmoothingEnabled(false)` 以维持像素画质感。
