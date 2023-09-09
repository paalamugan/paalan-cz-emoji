module.exports = {
  '*.{js,ts}': ['eslint --fix'],
  '**/*.ts': () => 'pnpm type-check',
  '*.{json,yaml.md}': ['prettier --write'],
};
