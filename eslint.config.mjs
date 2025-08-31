// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  {
    files: ['tests/**/*.{ts,js}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-duplicates': 'off',
      'no-unused-expressions': 'off',
      'prefer-const': 'off',
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  }
)
