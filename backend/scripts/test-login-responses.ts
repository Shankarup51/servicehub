async function testAccount(email: string, expectedRole: string) {
  console.log(`\n--- Testing Login for ${email} (Expected role: ${expectedRole}) ---`);

  const loginRes = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!' }),
  });

  if (!loginRes.ok) {
    const errorBody = await loginRes.text();
    throw new Error(`Login failed for ${email} with status ${loginRes.status}: ${errorBody}`);
  }

  const loginData = await loginRes.json();
  console.log('Login Response Status:', loginRes.status);
  console.log('Login User Object:', JSON.stringify(loginData.user, null, 2));

  // Assertions
  if (!Array.isArray(loginData.user.roles)) {
    throw new Error(`FAIL: user.roles is not an array for ${email}`);
  }
  if (!loginData.user.roles.includes(expectedRole)) {
    throw new Error(`FAIL: user.roles does not contain ${expectedRole} for ${email}`);
  }
  if (loginData.user.role !== expectedRole) {
    throw new Error(`FAIL: user.role is not ${expectedRole} for ${email}`);
  }

  console.log(`[PASS] Login response contains roles: ${JSON.stringify(loginData.user.roles)} and role: "${loginData.user.role}"`);

  // Test Profile retrieval (GET /users/profile) for session restoration verification
  console.log(`Testing Session Restoration / Profile Retrieval (GET /users/profile)...`);
  const profileRes = await fetch('http://localhost:3001/users/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${loginData.accessToken}`,
    },
  });

  if (!profileRes.ok) {
    const errText = await profileRes.text();
    throw new Error(`Profile fetch failed with status ${profileRes.status}: ${errText}`);
  }

  const profileData = await profileRes.json();
  console.log('Profile User Object:', JSON.stringify(profileData, null, 2));

  if (!Array.isArray(profileData.roles) || !profileData.roles.includes(expectedRole)) {
    throw new Error(`FAIL: Profile retrieval did not return expected role ${expectedRole}`);
  }
  console.log(`[PASS] Session restoration / Profile retrieval correctly returns roles: ${JSON.stringify(profileData.roles)}`);
}

async function run() {
  await testAccount('customer@servicehub.com', 'CUSTOMER');
  await testAccount('provider@servicehub.com', 'SERVICE_PROVIDER');
  await testAccount('admin@servicehub.com', 'ADMIN');
  console.log('\n===========================================');
  console.log('ALL LOGIN AND PROFILE TESTS PASSED (3/3 roles)!');
  console.log('===========================================');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
