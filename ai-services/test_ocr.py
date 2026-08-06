import requests

def test_ocr():
    url = "http://localhost:8000/extract-enrollments"
    # Create a dummy image
    with open("dummy.png", "wb") as f:
        f.write(b"NOT_A_REAL_IMAGE_DATA")
    
    try:
        with open("dummy.png", "rb") as f:
            files = {"file": f}
            print("Sending request...")
            response = requests.post(url, files=files, timeout=120)
            print("Status:", response.status_code)
            print("Response:", response.text)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_ocr()
