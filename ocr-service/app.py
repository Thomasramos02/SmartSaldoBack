import os
from flask import Flask, request, jsonify
from pdf2image import convert_from_bytes
import pytesseract
import tempfile

# IMPORTANT:
# You must install Tesseract-OCR on your system and add it to your PATH.
# For Windows, you can find the installer here:
# https://github.com/UB-Mannheim/tesseract/wiki
#
# You must also install Poppler for pdf2image to work.
# For Windows, you can download it from:
# https://github.com/oschwartz10612/poppler-windows/releases/
# and add the 'bin' directory to your system PATH.

app = Flask(__name__)
PORT = int(os.environ.get("PORT", "5002"))
DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"

@app.route('/extract_text', methods=['POST'])
def extract_text_from_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Read the file into memory
        pdf_bytes = file.read()

        # Use a temporary directory to avoid file conflicts
        with tempfile.TemporaryDirectory() as path:
            # Convert PDF to a list of images
            images = convert_from_bytes(pdf_bytes, output_folder=path, poppler_path=None) # Set poppler_path if not in system PATH

            full_text = ""
            for image in images:
                # Use pytesseract to do OCR on the image
                text = pytesseract.image_to_string(image, lang='por') # Assuming Portuguese
                full_text += text + "\n"

            return jsonify({"text": full_text})

    except Exception as e:
        # Log the exception for debugging
        print(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Running on port 5002 to avoid conflicts with ml-service
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
