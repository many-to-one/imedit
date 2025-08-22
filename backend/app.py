from fastapi import FastAPI, UploadFile, Form, File, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
# from fastapi.staticfiles import StaticFiles
import numpy as np
from PIL import Image
import photoedit
import io, os
import uuid

app = FastAPI()

# Serve static frontend files
# app.mount("/static", StaticFiles(directory="static"), name="static")

UPLOAD_PATH = "uploads"
RESULT_PATH = "results"
os.makedirs(UPLOAD_PATH, exist_ok=True)
os.makedirs(RESULT_PATH, exist_ok=True)

# Store the currently uploaded image
CURRENT_IMAGE = None

@app.get("/")
async def index():
    """Serve the HTML with sliders."""
    with open("frontend/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())


# @app.post("/upload")
# async def upload_image(file: UploadFile):
#     """Upload an image and set it as current."""
#     print('********************* UPLOAD **********************', file)
#     global CURRENT_IMAGE
#     img_bytes = await file.read()
#     img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
#     CURRENT_IMAGE = np.array(img)
#     out_path = os.path.join(UPLOAD_PATH, file.filename)
#     img.save(out_path)
#     return {"filename": file.filename}

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    global CURRENT_IMAGE

    # Walidacja formatu
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png"]:
        raise HTTPException(status_code=400, detail="Obsługiwane formaty: jpg, jpeg, png")

    # Wczytanie obrazu do PIL
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGBA")  # zawsze trzymaj RGBA w pamięci
    CURRENT_IMAGE = image

    # Generowanie unikalnej nazwy pliku
    new_filename = f"{uuid.uuid4()}.{ext}"
    save_path = os.path.join(UPLOAD_PATH, new_filename)

    # Zapis w odpowiednim trybie
    if ext in ["jpg", "jpeg"]:
        image.convert("RGB").save(save_path, format="JPEG", quality=95)
    elif ext == "png":
        image.save(save_path, format="PNG")

    return JSONResponse({"filename": new_filename})


@app.post("/adjust")
async def adjust_image(
    hue_shift: float = Form(...),
    sat_scale: float = Form(...),
    light_scale: float = Form(...)
):
    """Apply HSL adjustment to the current image."""
    global CURRENT_IMAGE
    if CURRENT_IMAGE is None:
        return {"error": "No image uploaded"}

    adjusted = photoedit.apply_hsl_adjustment(
        CURRENT_IMAGE.copy(),
        hue_shift=hue_shift,
        sat_scale=sat_scale,
        light_scale=light_scale,
    )

    result_img = Image.fromarray(adjusted)
    out_path = os.path.join(RESULT_PATH, "preview.png")
    result_img.save(out_path)

    return FileResponse(out_path)
