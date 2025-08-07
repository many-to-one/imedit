import photoedit
from PIL import Image
import numpy as np

img = Image.open("test.png").convert("RGBA")
arr = np.array(img)

adjusted = photoedit.apply_hsl_adjustment(arr, hue_shift=30, sat_scale=1.2, light_scale=1.0)
out = Image.fromarray(adjusted)
out.save("result.png")



# import photoedit
# print(dir(photoedit))  # sprawdź, czy jest apply_hsl_adjustment
