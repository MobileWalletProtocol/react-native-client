import type {Config} from 'jest';

const config: Config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // The root directory that Jest should scan for tests and modules within
  rootDir: '.',

  // The glob patterns Jest uses to detect test files
  testMatch: ['<rootDir>/src/**/*.test.[tj]s?(x)'],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(js|ts|tsx)$': ['ts-jest', {
      useESM: true,
    },],
  },
};

export default config;
