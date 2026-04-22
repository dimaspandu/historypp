# Changelog

All notable changes to this project will be documented in this file.

---

## [1.0.2] - 2026-04-22

### Added
- Introduced base path configuration for nested environments
- Added hash mode support for non-server environments
- Implemented unified path handling layer (base + query + hash)
- Added initial examples:
  - Basic routing
  - Bottom sheet (state-driven)

### Changed
- Refactored navigation to use centralized path normalization
- Improved URL consistency across push/replace/pop
- Updated README to clarify routing modes and server behavior
- Updated examples to use `history.config({ base })`

### Fixed
- Fixed incorrect path duplication when using nested base paths
- Fixed navigation issues on refresh with subdirectory examples

### Notes
- This release focuses on stabilizing core routing behavior and project structure
- Some examples are placeholders and will be expanded in future versions

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