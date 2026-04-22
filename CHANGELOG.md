# Changelog

All notable changes to this project will be documented in this file.

---

## [1.0.0] - 2026-04-22

### Added
- Initial project setup
- Repository structure and documentation
- High-level API design for History API extension
- Routing concept using Trie (including dynamic routes)
- Lifecycle design:
  - onMeet
  - onArrive
  - onExit
  - onComeback
- Guard system concept:
  - canLeave (route-level)
  - global blockers
- Middleware pipeline design
- Navigation methods definition:
  - navigatePush
  - navigateReplace
  - navigatePop
- Routing modes concept:
  - history mode
  - hash mode
- Context object (ctx) structure
- Execution flow diagrams (activity & sequence)
- Initial examples planning

### Notes
- This version represents the initial design and architecture proposal.
- Implementation is not fully completed and may evolve in future releases.