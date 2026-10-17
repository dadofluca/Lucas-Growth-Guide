# Builder: real-fix review protocol

Builder can now propose a real, narrow code change as a **draft pull request**. The first candidate is PR #4, fixing stale Family Chat fetch responses.

## Before review or merge
1. CI tests must pass on the PR's head SHA.
2. A human reviews the changed code and tests.
3. Validate with two authenticated family accounts on iPhone, including delayed network responses and navigating away during refresh.
4. Confirm messages are still family-scoped and that the fix cannot change care records.
5. Merge into development only after approval. Deployment to production is a separate action.

## Automation limits
The default-branch `builder-draft-pr.yml` workflow is a manually dispatched synthetic documentation-only demonstration. It is **not** a general-purpose bug fixing worker. PR #4 was created through an explicitly initiated coding session, not by that workflow. Do not claim autonomous diagnosis or repair until an unattended runner is deployed and verified.

## Recommended next phase
Introduce a small catalog of reviewed fix recipes with specific source and test allowlists. Each recipe should be tested in a fresh branch, open a draft PR, and never auto-merge. The agent should not accept arbitrary untrusted issue text as shell commands or code.
