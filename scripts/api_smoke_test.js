const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d || '{}');
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: d });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  try {
    console.log('Logging in as student@example.com');
    const login = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'student@example.com', password: 'Password123!' });

    if (!login.body || !login.body.data || !login.body.data.token) {
      console.error('Login failed:', login.body || login.statusCode);
      process.exit(1);
    }

    const token = login.body.data.token;
    console.log('Login successful, token received (truncated):', token.slice(0, 20) + '...');

    // Create a booking for Room 101
    const today = new Date().toISOString().slice(0, 10);
    const bookingPayload = {
      roomId: 'cmk911eav00027lc69uo18tqt',
      title: 'Smoke Test Booking',
      description: 'Automated smoke test',
      date: today,
      startTime: '11:00',
      endTime: '12:00',
    };

    console.log('Creating booking for', today, bookingPayload.startTime + '-' + bookingPayload.endTime);
    const create = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    }, bookingPayload);

    console.log('Create response:', create.statusCode, JSON.stringify(create.body));

    // List my bookings
    const my = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings/my',
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token },
    });

    console.log('My bookings response:', my.statusCode, JSON.stringify(my.body));
  } catch (e) {
    console.error('Smoke test failed:', e.message || e);
    process.exit(1);
  }
})();
