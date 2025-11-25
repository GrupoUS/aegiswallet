// Satisfies: Section 1: LGPD Compliance Testing of .claude/skills/webapp-testing/SKILL.md
// Orchestrator for healthcare testing environment
import { ensureTestUtils } from './healthcare/test-utils';
import './setup-dom';

ensureTestUtils();

export * from './healthcare/lgpd-test-helpers';
export type { TestUtils } from './healthcare/test-utils';
export { ensureTestUtils } from './healthcare/test-utils';
