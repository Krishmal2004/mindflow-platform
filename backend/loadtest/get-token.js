#!/usr/bin/env node
/**
 * Logs in against a running backend and prints the JWT access_token to stdout.
 * Used once before a load-test run so scenarios reuse a single token instead of
 * hammering /api/auth/login (which sits behind the 20/15min auth rate limiter)
 * on every virtual user.
 *
 * Usage:
 *   AUTH_TOKEN=$(node loadtest/get-token.js)
 *
 * Env vars:
 *   BASE_URL      default http://localhost:3000
 *   TEST_EMAIL    default seed.participant@mindflow.app (from `npm run seed`)
 *   TEST_PASSWORD default SeedParticipant123!
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'seed.participant@mindflow.app';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'SeedParticipant123!';

async function main() {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    const body = await res.json();
    if (!res.ok || !body.session?.access_token) {
        console.error(`Login failed (${res.status}):`, body.error || body);
        process.exit(1);
    }
    process.stdout.write(body.session.access_token);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
