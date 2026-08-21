import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// @testing-library/react's automatic afterEach-based cleanup relies on
// detecting a global `afterEach` (registered when vitest's `test.globals`
// is true). This config deliberately keeps globals off elsewhere in the
// repo, so cleanup is wired explicitly here instead — without it, every
// render() in a later test accumulates in the same jsdom document instead
// of starting fresh.
afterEach(cleanup)
