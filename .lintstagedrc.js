module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    () => 'tsc --noEmit --project tsconfig.base.json',
  ],
  '*.{js,json,md}': ['prettier --write'],
};
