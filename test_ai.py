import urllib.request
import json

def main():
    payload = {
        "insightType": "BULK_EXAM_FEEDBACK",
        "data": {
            "students": [
                {
                    "studentId": "test-123",
                    "marks": {"Math": 90, "Science": 80}
                }
            ]
        }
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request("http://127.0.0.1:8000/analyze", data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            with open("response.txt", "w", encoding="utf-8") as f:
                f.write(response.read().decode('utf-8'))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
