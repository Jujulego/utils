import type { Config } from 'jest';

const config: Config = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  roots: [
    '<rootDir>/tests'
  ],
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest'
  },

  // Coverage
  collectCoverage: true,
  collectCoverageFrom: ['src/**'],
  coverageDirectory: 'coverage',
};

export default config;
