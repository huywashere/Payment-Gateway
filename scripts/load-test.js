import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    steady_gateway_reads: { executor: 'constant-vus', vus: 20, duration: '30s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8088';
const secretKey = __ENV.GATEWAY_SECRET_KEY || 'sk_test_demo_gateway_key_999';

export default function () {
  const response = http.get(`${baseUrl}/v1/balance`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    tags: { operation: 'balance' },
  });
  check(response, { 'balance responds 200': (result) => result.status === 200 });
  sleep(0.2);
}
