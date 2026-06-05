async function globalSetup() {
  // Backend health check skipped — all tests mock the API via page.route().
  // Re-enable when running against a real test backend (see .env.e2e.example).
}

export default globalSetup;
