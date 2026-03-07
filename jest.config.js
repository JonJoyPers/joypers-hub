module.exports = {
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(zustand)/)',
  ],
  setupFiles: ['<rootDir>/src/__tests__/setup.js'],
  testEnvironment: 'node',
};
