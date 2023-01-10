module.exports = {
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    './src/': {
      statements: 55,
      branches: 50,
      functions: 55,
      lines: 50,
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
