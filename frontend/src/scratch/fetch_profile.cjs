const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/v1/profile/e83d02bd-298b-4239-aaf6-4719b048c2c4',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log("Attendance Data:", {
        overallAttendance: json.data?.overallAttendance,
        totalClassesConducted: json.data?.totalClassesConducted,
        totalClassesAttended: json.data?.totalClassesAttended
      });
    } catch(e) { console.log(data); }
  });
});

req.on('error', (e) => { console.error(`Problem with request: ${e.message}`); });
req.end();
