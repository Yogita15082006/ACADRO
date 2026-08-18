const jwt = require('jsonwebtoken');

const SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
const payload = {
  sub: "student@example.com"
};

// Wait, the payload structure might be different. Let's look at `JwtUtils.java`.
