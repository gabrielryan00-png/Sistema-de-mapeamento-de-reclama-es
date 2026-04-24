from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
OUT_DIR = os.path.join(ROOT, "icons")
os.makedirs(OUT_DIR, exist_ok=True)

def generate(path_png, path_ico):
    size = 256
    bg = (43,85,151)  # COR_AZUL
    fg = (255,255,255)

    img = Image.new("RGBA", (size, size), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    # Circle background
    draw.ellipse([(16,16),(size-16,size-16)], fill=bg)

    # Large O letter in center
    try:
        fpath = os.path.join(os.path.dirname(__file__), "DejaVuSans-Bold.ttf")
        font = ImageFont.truetype(fpath, 140)
    except Exception:
        font = ImageFont.load_default()

    try:
        w, h = draw.textsize("O", font=font)
    except Exception:
        w, h = font.getsize("O") if hasattr(font, 'getsize') else (100, 100)
    draw.text(((size-w)/2, (size-h)/2-6), "O", font=font, fill=fg)

    img.save(path_png, format="PNG")
    # Save ICO (contains multiple sizes)
    img.convert('RGB').save(path_ico, format='ICO', sizes=[(64,64),(128,128),(256,256)])

if __name__ == '__main__':
    png = os.path.join(OUT_DIR, 'ouvidoria_icon.png')
    ico = os.path.join(OUT_DIR, 'ouvidoria_icon.ico')
    generate(png, ico)
    print('Generated:', png, ico)
