module.exports = {
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    './src/': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 90,
    },
  },
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/obsolete/'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.ts'],
  testEnvironment: 'jest-environment-node',
  testMatch: [
    '**/__tests__/**/*.+(spec|test).+(ts|js)',
    '**/?(*.)+(spec|test).+(ts|js)',
  ],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
};
