from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
import numpy as np
import photoedit
import io, os, uuid

app = FastAPI()
# app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

UPLOAD_DIR = "uploads"
RESULT_DIR = "results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

# Keep current image in memory as PIL Image (RGBA)
CURRENT_IMAGE = None

@app.get("/")
async def index():
    """Serve the HTML with sliders."""
    with open("frontend/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    global CURRENT_IMAGE
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png"]:
        raise HTTPException(400, "Supported: jpg, jpeg, png")

    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGBA")  # keep RGBA in memory
    CURRENT_IMAGE = img

    new_name = f"{uuid.uuid4()}.{ext}"
    save_path = os.path.join(UPLOAD_DIR, new_name)
    if ext in ["jpg", "jpeg"]:
        img.convert("RGB").save(save_path, format="JPEG", quality=95)
    else:
        img.save(save_path, format="PNG")
    return JSONResponse({"filename": new_name})

@app.post("/adjust")
async def adjust_image(
    hue_shift: float = Form(...),
    sat_scale: float = Form(...),
    light_scale: float = Form(...)
):
    global CURRENT_IMAGE
    if CURRENT_IMAGE is None:
        raise HTTPException(400, "No image uploaded")

    arr = np.array(CURRENT_IMAGE)  # RGBA
    adjusted = photoedit.apply_hsl_adjustment(
        arr, hue_shift=hue_shift, sat_scale=sat_scale, light_scale=light_scale
    )
    out = Image.fromarray(adjusted)
    out_path = os.path.join(RESULT_DIR, "result.png")
    out.save(out_path, format="PNG")
    return FileResponse(out_path, media_type="image/png", filename="result.png")
