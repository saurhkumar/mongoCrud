module.exports = {
  env: {
    // browser: true,
    node: true,
    commonjs: true,
    mocha: true,
    es2021: true
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 13
  },
  ignorePatterns: [
    '/api/helpers/mongoFilter.pegjs',
    '/api/helpers/mongoFilter.js',
    '**/*.md'
  ],
  rules: {
    semi: ['error', 'always']
    // rules: { 'no-console': 'off' } // warn/ error
    // 'no-unused-vars': 'off',
    // 'no-undef': ['error', 'always']
  }
};
