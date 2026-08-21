// Registers jest-dom's matcher types (toBeInTheDocument, etc.) onto
// Vitest's Assertion interface. Lives under src/ (not the vitest.setup.ts
// that actually runs the import at test time, which tsconfig's
// "include": ["src"] doesn't reach) purely so tsc --noEmit sees the
// augmentation when typechecking test files that use those matchers.
import '@testing-library/jest-dom/vitest'
