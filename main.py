# import photoedit
# from PIL import Image
# import numpy as np

# img = Image.open("test.png").convert("RGBA")
# arr = np.array(img)

# adjusted = photoedit.apply_hsl_adjustment(arr, hue_shift=60, sat_scale=1.2, light_scale=1.0)
# out = Image.fromarray(adjusted)
# out.save("result.png")



import threading
import webview
import uvicorn


# Function to run FastAPI in a thread
def start_backend():
    uvicorn.run(
        "backend.app_2:app",  # assuming your FastAPI app is in backend/app.py
        host="127.0.0.1",
        port=8000,
        reload=False,  # disable reload for production/pywebview
        log_level="info"
    )


if __name__ == "__main__":
    # Run FastAPI in background
    t = threading.Thread(target=start_backend, daemon=True)
    t.start()

    # Start pywebview
    webview.create_window(
        "My App",
        "http://127.0.0.1:8000",  # served by FastAPI
        width=1200,
        height=800,
        resizable=True,
    )
    webview.start(debug=True)
