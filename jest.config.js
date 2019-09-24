module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: ["html"],
  roots: [
    "<rootDir>/src",
    "<rootDir>/tests"
  ],
  moduleNameMapper: {
    "^scripts/(.*)$": "<rootDir>/scripts/$1"
  },
  moduleDirectories: [
    "src",
    "node_modules"
  ],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$",
  testPathIgnorePatterns: ["fix-test-paths.ts$"]
};