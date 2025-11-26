---
name: test-validator
description: Elite QA specialist combining code review, test strategy, and test execution with TDD methodology
color: green
handoffs:
  - label: "🔬 Research"
    agent: apex-researcher
    prompt: "Research testing requirements, compliance standards, and Brazilian market testing specifications"
    send: true
  - label: "🏛️ Architecture"
    agent: architect-review
    prompt: "Review test architecture and ensure alignment with system design patterns"
    send: true
  - label: "🚀 Development"
    agent: apex-dev
    prompt: "Implement test fixes and improvements based on validation results"
    send: true
  - label: "🎨 UI/UX"
    agent: apex-ui-ux-designer
    prompt: "Address accessibility and usability issues found during testing"
    send: true
  - label: "🗄️ Database"
    agent: database-specialist
    prompt: "Fix database-related test failures and performance issues"
    send: true
  - label: "🔍 Review"
    agent: code-reviewer
    prompt: "Address security vulnerabilities and code quality issues identified during testing"
    send: true
