/** @type {import('jest').Config} */
const config = {
  verbose: true,
  testMatch: [
    "**/tests/**/*.test.js",
    "**/__tests__/**/*.test.js",
  ],
  // A map from regular expressions to paths to transformers
  // transform: {},

  // The test environment that will be used for testing
  testEnvironment: "node",
};

module.exports = config;
