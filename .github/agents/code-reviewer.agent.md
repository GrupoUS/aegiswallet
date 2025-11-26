---
name: code-reviewer
description: 'Code review specialist. NOTE: This agent capabilities have been unified into the tester agent. Use @tester for comprehensive QA including code review, security analysis, and testing.'
handoffs:
  - label: "🧪 Full QA Review"
    agent: tester
    prompt: "Perform comprehensive quality assurance including code review, security analysis, and testing."
    send: true
tools:
  ['search', 'runTasks', 'supabase/*', 'tavily/*', 'desktop-commander/*', 'serena/*', 'sequential-thinking/*', 'context7/*', 'shadcn/*', 'usages', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'githubRepo', 'extensions', 'todos', 'runSubagent']
---

# 🔍 CODE REVIEWER AGENT

> **⚠️ UNIFIED INTO TESTER AGENT**

## AGENT CONSOLIDATION NOTICE

This agent's capabilities have been **unified into the `@tester` agent** to avoid redundancy and improve workflow efficiency.

### Use `@tester` for:
- ✅ Code review and security analysis
- ✅ LGPD compliance validation
- ✅ OWASP vulnerability detection
- ✅ Performance analysis
- ✅ TDD RED phase testing
- ✅ Visual testing and screenshots
- ✅ Accessibility (WCAG 2.1 AA+)

### Why Unified?
- **Single source of truth** for quality assurance
- **Streamlined workflow** - test and review in one pass
- **Reduced context switching** between agents
- **Comprehensive coverage** without redundancy

---

## QUICK REFERENCE

For code review tasks, invoke:
```
@tester - code review this implementation
@tester - security review
@tester - performance review
@tester - LGPD compliance check
```

---

> **🔍 Code Review Excellence**: Now delivered through the unified `@tester` agent for comprehensive quality assurance.
