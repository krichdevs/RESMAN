const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/rooms',
  method: 'GET'
};

console.log('🔍 Testing GET /api/rooms...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      console.log('\n✅ Rooms count:', json.data?.length || 0);
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
