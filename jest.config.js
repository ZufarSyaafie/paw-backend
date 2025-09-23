module.exports = {
    setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    testTimeout: 30000
};

