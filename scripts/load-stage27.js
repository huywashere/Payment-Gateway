import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    overview: { executor: 'constant-arrival-rate', rate: 20, timeUnit: '1s', duration: '30s', preAllocatedVUs: 10, maxVUs: 50 },
    edge_health: { executor: 'constant-vus', vus: 10, duration: '30s', exec: 'edgeHealth' },
  },
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500'] },
};

const core = __ENV.CORE_URL || 'http://localhost:8080';
const edge = __ENV.EDGE_URL || 'http://localhost:8090';
const key = __ENV.GATEWAY_SECRET_KEY || 'sk_test_demo_gateway_key_999';

export default function () {
  const response = http.get(`${core}/v1/dashboard/overview?days=30`, { headers: { Authorization: `Bearer ${key}` } });
  check(response, { 'overview 200': (result) => result.status === 200, 'overview contract': (result) => result.json('range_days') === 30 });
  sleep(0.05);
}

export function edgeHealth() {
  const response = http.get(`${edge}/readyz`);
  check(response, { 'edge ready': (result) => result.status === 200, 'queue reported': (result) => result.json('queue_capacity') > 0 });
  sleep(0.1);
}
