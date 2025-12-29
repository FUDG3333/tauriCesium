import cv2
import numpy as np
import os

# ====== 配置 ======
input_dir = "./outputs/annotation2"   # 标注渲染图目录
output_dir = "./outputs/mask2"        # 输出 mask 目录
os.makedirs(output_dir, exist_ok=True)

# ====== 类别定义（OpenCV: BGR）=====
# 类别编号一定要连续：0,1,2,3,4
# 0 = 背景（默认）
COLOR_CLASSES = {
    1: ((0, 0, 200), (80, 80, 255)),     # 红色
    2: ((0, 200, 0), (80, 255, 80)),     # 绿色
    3: ((200, 0, 0), (255, 80, 80)),     # 蓝色
    4: ((0, 200, 200), (80, 255, 255)), # 黄色
}

# ====== 主处理 ======
for fname in os.listdir(input_dir):
    if not fname.lower().endswith((".png", ".jpg", ".jpeg")):
        continue

    img_path = os.path.join(input_dir, fname)
    img = cv2.imread(img_path)

    if img is None:
        print("读取失败:", fname)
        continue

    h, w, _ = img.shape
    mask = np.zeros((h, w), dtype=np.uint8)  # 单通道 mask

    for class_id, (lower, upper) in COLOR_CLASSES.items():
        lower = np.array(lower, dtype=np.uint8)
        upper = np.array(upper, dtype=np.uint8)

        color_mask = cv2.inRange(img, lower, upper)
        mask[color_mask > 0] = class_id

    # 输出文件名
    name, _ = os.path.splitext(fname)
    out_path = os.path.join(output_dir, name + "_mask.png")

    cv2.imwrite(out_path, mask)
    print("已生成:", out_path)

print("全部 mask 生成完成 ✅")
