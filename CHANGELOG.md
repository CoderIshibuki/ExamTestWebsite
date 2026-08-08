# Changelog

All notable changes to this project will be documented in this file.

## [Phase 2] - 2026-08-08
### Added
- **Proctoring Service** (`backend/proctoring_service`): New microservice for handling AI Proctoring events and risk calculation.
- **Frontend App**: Full implementation of the student dashboard, exam room, and result summary using React, Material UI, and Socket.IO.
- **E2E Testing**: UI and backend end-to-end simulated test flow (E2E script coverage extended to Phase 2 features).

### Changed
- **Risk Engine**: Upgraded the `proctoring_service` risk scoring logic to use **Redis** instead of in-memory dictionaries. This enables multi-instance scalability and prevents data loss on container restarts. Risk state is saved under the key `risk:{exam_id}:{user_id}` with a 10-minute TTL.
- **Docker Compose**: Added `proctoring_service` and updated Nginx gateway routes.
