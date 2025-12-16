import cv2
import numpy as np

m = cv2.imread("./outputs/img_mask/view_1 (1)_mask.png", cv2.IMREAD_UNCHANGED)
print(np.unique(m))


# 0 = 背景
# 1 = 红
# 2 = 绿
# 3 = 蓝
# 4 = 黄