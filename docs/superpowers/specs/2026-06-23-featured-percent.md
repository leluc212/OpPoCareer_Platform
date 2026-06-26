# Featured Percent System

## Scope

Build a new backend flow for candidate featured percentage, separate from the existing profile completion flow. The web must not create mock or fallback percentage data. If the API endpoint is not configured, the UI shows no featured percentage value.

## Formula

- Personal profile: max 40%.
- Started work: max 10%.
- Completed work: max 10%.
- On time: max 10%.
- Candidate workplace photo/review: max 10%, counted only after backend stores an approved proof/review status.
- Employer criteria: max 20%, based on 5 employer-defined criteria. Each checked criterion is 4%.

The extra completed-work 10% is required so the approved rules can reach the fixed 100% cap without letting percentage grow by repeated jobs.

## Levels

- Under 40%: incomplete profile, not ready for work.
- 40% and above: work-ready.
- 60% and above: growing.
- 80% and above: featured candidate tag.
- 100%: superstar tag.

When there is employer/job history, the candidate's displayed percentage is the average of the per-employer/job percentages. Without history, it is the profile percentage only.

## Data Rules

- Reuse account/profile/CV data. Do not duplicate raw personal information into scoring tables or payloads.
- Missing profile notifications include field keys/labels only, not raw missing values.
- Photo fraud is handled by employer review for now, not by a paid AWS AI service.

## Implementation Notes

- Backend rules: `amplify/backend/featured_percent_rules.py`.
- Backend Lambda: `amplify/backend/featured-percent-lambda.py`.
- Frontend service: `src/services/featuredPercentService.js`.
- Candidate dashboard UI: `src/components/FeaturedPercentPanel.jsx`, wired into `src/pages/candidate/CandidateDashboard.jsx`.
- Required frontend env: `VITE_FEATURED_PERCENT_API_URL`.

## Deployment Env

Set these Lambda environment variables when deploying the new backend flow:

- `CANDIDATE_PROFILES_TABLE=CandidateProfiles`
- `APPLICATIONS_TABLE=StandardApplications`
- `NOTIFICATIONS_TABLE=Notifications`

