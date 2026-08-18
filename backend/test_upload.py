import requests

# 1. Login to get token
login_url = "http://localhost:8080/api/auth/login"
login_payload = {
    "email": "student@example.com",
    "password": "password"
}
response = requests.post(login_url, json=login_payload)
print("Login Status:", response.status_code)
if response.status_code != 200:
    print("Login Failed:", response.text)
    # try another user
    login_payload["email"] = "aarav.sharma@acronexus.edu"
    response = requests.post(login_url, json=login_payload)
    print("Login Status (aarav):", response.status_code)
    if response.status_code != 200:
        print("Login Failed:", response.text)
        exit(1)

token = response.json().get("data", {}).get("token")
print("Got Token")

# 2. Upload Photo
upload_url = "http://localhost:8080/api/v1/profile/photo"
headers = {
    "Authorization": f"Bearer {token}"
}
files = {
    "file": ("test.jpg", b"dummy image content", "image/jpeg")
}
print("Uploading Photo...")
upload_response = requests.post(upload_url, headers=headers, files=files)
print("Upload Status:", upload_response.status_code)
print("Upload Response:", upload_response.text)
