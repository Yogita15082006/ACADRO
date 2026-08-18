const fs = require('fs');

async function testUpload() {
  try {
    const loginRes = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@example.com", password: "password" })
    });
    let loginData = await loginRes.json();
    if (!loginData.success) {
      const loginRes2 = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "aarav.sharma@acronexus.edu", password: "password" })
      });
      loginData = await loginRes2.json();
    }
    const token = loginData.data?.token;
    if (!token) {
      console.log("Failed to login", loginData);
      return;
    }
    
    // Upload
    const formData = new FormData();
    const blob = new Blob(["test"], { type: "image/jpeg" });
    formData.append("file", blob, "test.jpg");
    
    const uploadRes = await fetch("http://localhost:8080/api/v1/profile/photo", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    
    console.log("Upload status:", uploadRes.status);
    const result = await uploadRes.text();
    console.log("Result:", result);
  } catch (err) {
    console.error(err);
  }
}

testUpload();
