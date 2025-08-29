from flask import Flask, request, send_file
import torch
from torchvision import transforms
from PIL import Image
import io
import os
import numpy as np
from MODNet.src.models.modnet import MODNet

app = Flask(__name__)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

modnet = MODNet(backbone_pretrained=False) 
modnet.to(device)

ckpt = torch.load('modnet_final.ckpt', map_location=device)
if "state_dict" in ckpt:
    state_dict = ckpt["state_dict"]
else:
    state_dict = ckpt

new_state_dict = {}
for k, v in state_dict.items():
    new_state_dict[k.replace("module.", "")] = v

modnet.load_state_dict(new_state_dict, strict=False)
modnet.eval()
print("✅ Model checkpoint loaded")

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def remove_bg(image: Image.Image) -> Image.Image:
    # Resize image to 512x512 and convert to tensor
    transform = transforms.Compose([
        transforms.Resize((512, 512)),
        transforms.ToTensor()
    ])
    img_tensor = transform(image).unsqueeze(0).to(device)

    # Run MODNet to predict alpha matte
    with torch.no_grad():
        _, _, matte = modnet(img_tensor, True)

    # Convert matte to PIL image
    matte = matte[0][0].cpu().numpy()
    matte = Image.fromarray((matte * 255).astype('uint8')).resize(image.size)

    # Combine original image with alpha matte
    image = image.convert("RGBA")
    image.putalpha(matte)
    return image

@app.route('/remove-bg', methods=['POST'])
def handle_upload():
    if 'file' not in request.files:
        return {'error': 'No file uploaded'}, 400

    file = request.files['file']
    if not allowed_file(file.filename):
        return {'error': 'Invalid file type'}, 400
    try:
        input_image = Image.open(file.stream).convert("RGB")
    except Exception:
        return {'error': 'Invalid image format'}, 400

    output_image = remove_bg(input_image)

    img_io = io.BytesIO()
    output_image.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3030)
