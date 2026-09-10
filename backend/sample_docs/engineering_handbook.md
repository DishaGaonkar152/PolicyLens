# ACME Corporation — Product Engineering Handbook
## Engineering Excellence Standards & Best Practices
## Version 1.8 | Owner: VP of Engineering | Updated: February 2025

---

## OVERVIEW

This handbook defines the engineering standards, development workflows, deployment procedures, and architectural guidelines for all engineering teams at ACME Corporation. It serves as the authoritative reference for how we build, test, deploy, and maintain software at ACME.

All engineers are expected to be familiar with and adhere to these standards. Exceptions require written approval from your Engineering Manager and the VP of Engineering.

---

## SECTION 1: DEVELOPMENT STANDARDS

### 1.1 Code Quality Standards
All code submitted at ACME must meet these minimum quality bars:

**Language-Specific Standards:**
- **Python:** PEP 8 compliance, Black formatting, type hints required for all public functions
- **JavaScript/TypeScript:** ESLint + Prettier, strict TypeScript mode required for new projects
- **Java:** Google Java Style Guide, Checkstyle enforced in CI
- **Go:** gofmt formatting, golint compliance

**Universal Requirements:**
- Functions should be ≤50 lines; classes ≤300 lines (discuss exceptions with your tech lead)
- Cyclomatic complexity ≤10 (enforced by SonarQube)
- No hardcoded credentials, API keys, or secrets in code (use Vault or environment variables)
- Meaningful variable and function names — no single-letter names except loop counters

### 1.2 Code Review Process
All code changes require review before merging to main/master branches:

**Review Requirements:**
- Minimum 2 approvals for changes to core services or production-critical paths
- Minimum 1 approval for feature work and bug fixes
- Security-sensitive changes require approval from the Security Engineering team

**Review Timeline SLAs:**
- Initial review response: within 24 business hours
- Follow-up review (after changes): within 4 business hours
- Urgent fixes (P0/P1): within 1 hour (use the @oncall-eng Slack handle)

**Code Review Checklist:**
- Logic correctness and edge cases covered
- Tests written for new functionality (unit + integration)
- No performance regressions (check query plans for DB changes)
- API contracts maintained (backward compatibility)
- Documentation updated for public APIs

### 1.3 Git Workflow
ACME uses GitHub with trunk-based development:

**Branch Naming Convention:**
- Features: `feature/JIRA-123-short-description`
- Bug fixes: `fix/JIRA-456-brief-description`
- Hotfixes: `hotfix/JIRA-789-critical-fix`
- Release branches: `release/v2.4.0`

**Commit Message Format (Conventional Commits):**
```
type(scope): short description (max 72 chars)

Longer description if needed (wrap at 72 chars)

JIRA: PROJ-123
```
Types: feat, fix, docs, style, refactor, test, chore, perf

**Pull Request Requirements:**
- Linked JIRA ticket
- Description of what changed and why
- Screenshots for UI changes
- Test plan documented
- Breaking changes clearly labeled

---

## SECTION 2: TESTING STANDARDS

### 2.1 Testing Requirements by Type
| Test Type | Coverage Requirement | Tooling |
|-----------|---------------------|---------|
| Unit Tests | Minimum 80% line coverage | pytest, Jest, JUnit |
| Integration Tests | All API endpoints covered | pytest, Supertest |
| E2E Tests | Critical user journeys | Playwright, Cypress |
| Performance Tests | Required for new endpoints (p95 < 200ms) | k6, Locust |
| Security Tests | OWASP Top 10 scan on PRs | SAST via SonarQube, DAST via OWASP ZAP |

### 2.2 Test Environments
ACME maintains the following environments:

| Environment | Purpose | Deployment Trigger |
|-------------|---------|------------------|
| Development (dev) | Individual feature testing | Auto-deploy on PR creation |
| Staging | Integration testing, QA, UAT | Auto-deploy on merge to main |
| Production | Live customer traffic | Manual promotion from staging |
| Load Testing (perf) | Performance and scalability testing | On-demand |

### 2.3 Quality Gates
No code merges to main without passing:
1. All unit and integration tests green
2. Code coverage meets or exceeds baseline (no regressions)
3. SonarQube quality gate passed (no critical or blocker issues)
4. Dependency vulnerability scan clean (no critical CVEs)
5. At least 1 code review approval (2 for critical paths)

---

## SECTION 3: DEPLOYMENT PROCESS

### 3.1 CI/CD Pipeline
ACME uses GitHub Actions for CI/CD. The pipeline runs on every PR and merge:

**CI Pipeline (on every PR):**
1. Lint and format checks
2. Unit tests
3. Integration tests
4. Code coverage report
5. SonarQube analysis
6. Docker image build (if applicable)
7. Security scans

**CD Pipeline (on merge to main):**
1. Build and tag Docker image
2. Deploy to Staging automatically
3. Run smoke tests on Staging
4. Notify QA team for sign-off
5. Create release candidate after QA approval
6. Manual promote button to Production

### 3.2 Production Deployment Windows
Production deployments are only allowed during:
- **Standard Window:** Tuesday and Thursday, 2:00 PM – 5:00 PM EST
- **Emergency Hotfix:** Any time, with P0 incident ticket + VP Engineering approval

Deployments are PROHIBITED during:
- Friday after 3 PM through Monday morning (weekend freeze)
- Company holidays
- Quarter-end close periods (last 3 business days of each quarter)

### 3.3 Rollback Procedures
If a production deployment causes issues:
1. On-call engineer declares an incident in PagerDuty
2. Immediate rollback via: `kubectl rollout undo deployment/<service-name>`
3. Or use the Deployment Dashboard at https://deploy.acme.com for one-click rollback
4. Root cause analysis (RCA) document must be submitted within 48 hours

### 3.4 Feature Flags
New features should be released behind feature flags using LaunchDarkly:
- Flag naming: `FEATURE_<team>_<feature-name>` (all uppercase)
- Flags should be cleaned up within 2 sprints of full rollout
- Emergency kill switches must be tested in staging before production

---

## SECTION 4: INFRASTRUCTURE AND ARCHITECTURE

### 4.1 Cloud Infrastructure
ACME runs on AWS (primary) with the following core services:
- **Compute:** EKS (Kubernetes) for containerized services, EC2 for legacy systems
- **Database:** RDS (PostgreSQL primary), ElastiCache (Redis), DynamoDB (high-scale NoSQL)
- **Storage:** S3 for object storage, EFS for shared file systems
- **Networking:** VPC per environment, Transit Gateway for cross-account routing
- **CDN:** CloudFront for static assets and API edge caching

### 4.2 Service Architecture Principles
ACME follows a microservices architecture with these guiding principles:
- Services should be independently deployable and scalable
- Inter-service communication via REST APIs (sync) or SNS/SQS (async)
- Each service owns its data — no shared databases between services
- Circuit breakers required for all synchronous external service calls
- Idempotency required for all state-mutating operations

### 4.3 API Design Standards
- All APIs must be RESTful and follow ACME API Design Guide (v2)
- OpenAPI 3.0 specification required for all new APIs
- Versioning via URL path: `/api/v1/`, `/api/v2/`
- Authentication: OAuth 2.0 + JWT tokens (no API keys for new services)
- Rate limiting: Default 1000 req/min per client (configurable per tier)
- Error responses must follow RFC 7807 Problem Details format

---

## SECTION 5: ON-CALL AND INCIDENT MANAGEMENT

### 5.1 On-Call Rotation
Each engineering team maintains a rotating on-call schedule:
- Primary on-call: 7-day rotations, compensated at \$200/week plus \$50/incident
- Secondary on-call (escalation): 7-day rotations, compensated at \$100/week
- On-call schedule managed in PagerDuty — all engineers must install the PagerDuty app

**Response Time SLAs:**
- P0 (Complete outage): Acknowledge within 5 minutes, engaged within 15 minutes
- P1 (Major degradation): Acknowledge within 15 minutes, engaged within 30 minutes
- P2 (Partial degradation): Acknowledge within 1 hour
- P3 (Minor issues): Acknowledge within 4 hours (business hours)

### 5.2 Incident Communication
- P0/P1 incidents: Post updates every 30 minutes in #incidents Slack channel
- Customer-facing incidents: Comms team updates https://status.acme.com
- All incidents require a PagerDuty incident ticket opened within 15 minutes

### 5.3 Post-Incident Review (PIR)
For P0 and P1 incidents, a blameless PIR must be completed within 5 business days:
- What happened (timeline of events)
- Why it happened (root cause analysis)
- What we're doing to prevent recurrence (action items with owners and dates)
- PIR template available in Confluence: Engineering > Incident Management > PIR Template

---

## SECTION 6: DOCUMENTATION STANDARDS

### 6.1 Required Documentation
| Document Type | Location | Frequency |
|--------------|----------|-----------|
| Architecture Decision Records (ADRs) | Confluence > Engineering > ADRs | Per significant decision |
| API Documentation | Generated from OpenAPI spec | Per release |
| Runbooks | Confluence > Runbooks | Per operational procedure |
| Post-Incident Reviews | Confluence > PIRs | Per P0/P1 incident |
| Service README | Repository root | Per service |

### 6.2 README Requirements
Every service repository must have a README.md containing:
- Service purpose and owner team
- Local development setup instructions
- Environment variable reference
- API overview and links to full docs
- Deployment instructions
- On-call escalation contacts

---

## SECTION 7: CONTACTS AND ESCALATION

- **Engineering Help:** #engineering-help Slack channel
- **Security Team:** security-eng@acme.com
- **DevOps/Platform Team:** #platform-eng Slack channel
- **On-Call (P0):** PagerDuty escalation or on-call phone: 1-800-555-ENG0
- **VP Engineering:** vpe@acme.com (for escalations only)
