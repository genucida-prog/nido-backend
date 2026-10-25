const http = require('http');
const { URL } = require('url');

const BASE = 'http://localhost:3001';

function fetchRaw(method, path, bodyInit = {}, init = {}) {
  const url = new URL(path, BASE);
  const headers = new Headers(init.headers);
  if (bodyInit.body) {
    headers.set('Content-Type', 'application/json');
  }
  return new Promise((resolve, reject) => {
    const options = {
      method,
      hostname: 'localhost',
      port: 3001,
      path: url.pathname + (url.search || ''),
      headers: {
        ...Object.fromEntries(headers.entries()),
        ...init.headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (bodyInit.body) req.write(JSON.stringify(bodyInit.body));
    req.end();
  });
}

function fetch(method, path, body, init = {}) {
  return fetchRaw(method, path, body ? { body, headers: init.headers } : {}, init);
}

async function test(name, method, path, body, headers = {}) {
  try {
    const res = await fetch(method, path, body, { headers });
    const parsed = JSON.parse(res.body);
    const disp = JSON.stringify(parsed).substring(0, 200);
    console.log(`${name}: ${res.status} ${disp}`);
    return { status: res.status, body: parsed, ok: res.status >= 200 && res.status < 300 };
  } catch (e) {
    console.log(`${name}: ERROR - ${e.message}`);
    return { status: null, body: null, ok: false };
  }
}

async function main() {
  // 1. Health check
  await test('1. Health check', 'GET', '/health');

  // 2. Signup
  await test('2. Signup', 'POST', '/api/auth/signup', {
    email: 'test+nido@gmail.com',
    password: 'testpass123',
    name: 'Test User',
  });

  // 3. Login
  const loginRes = await test('3. Login', 'POST', '/api/auth/login', {
    email: 'test+nido@gmail.com',
    password: 'testpass123',
  });
  const token = loginRes.body?.token;

  // 4. Auth check
  await test('4. Auth check', 'GET', '/api/auth/me', null, {
    Authorization: `Bearer ${token}`,
  });

  // 5. Create Circle
  const createCircle = await test('5. Create Circle', 'POST', '/api/circles', {
    name: 'Test Circle',
  }, {
    Authorization: `Bearer ${token}`,
  });
  const circleId = createCircle.body?.id;

  // 6. List Circles
  await test('6. List Circles', 'GET', '/api/circles', null, {
    Authorization: `Bearer ${token}`,
  });

  // 7. Create Place
  await test('7. Create Place', 'POST', `/api/places/circle/${circleId}`, {
    name: 'Casa',
    latitude: 19.4326,
    longitude: -99.1332,
    radiusMeters: 100,
  }, {
    Authorization: `Bearer ${token}`,
  });

  // 8. List Places
  await test('8. List Places', 'GET', `/api/places/circle/${circleId}`, null, {
    Authorization: `Bearer ${token}`,
  });

  // 9. Update Location
  await test('9. Update Location', 'POST', '/api/locations/update', {
    latitude: 19.4326,
    longitude: -99.1332,
    batteryLevel: 85,
    isCharging: false,
  }, {
    Authorization: `Bearer ${token}`,
  });

  // 10. Trigger SOS
  await test('10. Trigger SOS', 'POST', '/api/sos/trigger', {
    circleId,
    latitude: 19.4326,
    longitude: -99.1332,
  }, {
    Authorization: `Bearer ${token}`,
  });

  // 11. List Notifications
  await test('11. List Notifications', 'GET', '/api/notifications', null, {
    Authorization: `Bearer ${token}`,
  });

  // 12. Start Drive
  const startDrive = await test('12. Start Drive', 'POST', '/api/drives/start', {
    circleId,
  }, {
    Authorization: `Bearer ${token}`,
  });
  const driveId = startDrive.body?.driveId;

  // 13. End Drive
  await test('13. End Drive', 'POST', '/api/drives/end', {
    driveId,
  }, {
    Authorization: `Bearer ${token}`,
  });

  // 14. Create Membership
  await test('14. Create Membership', 'POST', '/api/memberships/checkout', {
    tier: 'gold',
    circleId,
  }, {
    Authorization: `Bearer ${token}`,
  });

  // 15. Stripe Webhook
  await test('15. Stripe Webhook', 'POST', '/api/webhooks/stripe', {
    type: 'checkout.session.completed',
    data: {
      object: {
        metadata: {
          userId: 'test-user-id',
          circleId,
          tier: 'gold',
        },
      },
    },
  }, {
    'Content-Type': 'application/json',
  });

  console.log('\nAll tests completed.');
}

main().catch(console.error);