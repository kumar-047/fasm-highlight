module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    maxWorkers: 1,
    moduleNameMapper: {
        '^vscode$': '<rootDir>/test/mocks/vscode.ts'
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json', isolatedModules: true }]
    }
};
