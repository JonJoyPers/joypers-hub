/**
 * Two parallel Jest projects:
 *
 * 1. "unit"      — fast Node-environment tests for stores, services,
 *                  pure logic, AND build-time tooling (Expo config plugins,
 *                  scripts). No RN runtime, no jsdom.
 *
 * 2. "component" — RN component tests via @testing-library/react-native,
 *                  using the jest-expo/ios platform preset (Haste config +
 *                  .ios.* extensions). Files end in `*.rntl.test.{js,jsx}`
 *                  so they don't collide with the unit project.
 *
 *                  rntl-setup.js force-touches Expo's lazy WinterCG globals
 *                  during test setup — without it, RNTL's cleanup pass
 *                  triggers a require AFTER Jest has flipped
 *                  `isInsideTestCode = false`, throwing "import outside
 *                  the scope of the test code". Note: project-level
 *                  `setupFiles` array is concatenated with the preset's,
 *                  so jest-expo's own setup still runs.
 *
 * Run all:        npm test
 * Run only unit:  npm test -- --selectProjects unit
 * Run only RNTL:  npm test -- --selectProjects component
 */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/**/*.test.{js,jsx}',
        '<rootDir>/plugins/**/*.test.{js,jsx}',
      ],
      testPathIgnorePatterns: ['/node_modules/', '\\.rntl\\.test\\.'],
      transform: {
        '^.+\\.jsx?$': 'babel-jest',
      },
      transformIgnorePatterns: ['node_modules/(?!(zustand)/)'],
      setupFiles: ['<rootDir>/src/__tests__/setup.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'component',
      preset: 'jest-expo/ios',
      testMatch: ['<rootDir>/src/**/*.rntl.test.{js,jsx}'],
      setupFiles: ['<rootDir>/src/__tests__/rntl-setup.js'],
    },
  ],
};
