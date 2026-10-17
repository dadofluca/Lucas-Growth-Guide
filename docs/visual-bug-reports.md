# Visual bug reports — screenshot and short screen recording

## Family member experience
- 'Report a problem' > 'Show us the problem'.
- Choose **Screenshot** or **Short recording** (5 seconds suggested; 30 seconds maximum).
- On iPhone/PWA, guide user to iOS Screen Recording in Control Center, then attach the resulting video. Do not promise automatic full-screen recording.
- Optionally use an in-app screenshot only when browser capabilities and user consent support it; otherwise attach from Photos/Files.
- Show a preview, editable description, optional redaction guidance, and an explicit **Send report** confirmation.
- Never automatically capture screen, camera, microphone, or background activity.
- Report only the user-selected file. Do not automatically attach Teddy chat, private messages, or other family members' personal data.

## Technical design
- Private Supabase Storage bucket `agent-report-media`; no public bucket URLs.
- Object key scoped to family and report UUID; generate a short-lived signed URL only after server-side family/owner authorization.
- File type allowlist: image/jpeg, image/png, image/heic (if supported), video/mp4, video/quicktime.
- Limit video duration to 30 seconds, file size to 40 MB, and attachments to one per report initially.
- Use upload authorization bound to authenticated reporter and family membership, with path validation; do not trust client-provided family IDs.
- Store metadata separately: report_id, reporter_id, family_id, storage_path, mime_type, size_bytes, created_at, retention_expires_at.
- Do not embed storage paths or signed URLs in agent findings or public diagnostics.
- Automatically expire media after 30 days, with user-visible deletion option. Implement cleanup before enabling uploads.
- Warn that screen recordings may contain names, notifications, or private Teddy text. Let users review before sending; strip image location metadata where feasible.
- No automatic AI analysis of media until a separate privacy review and explicit consent.

## Admin experience
- Only an explicitly authorized family administrator may view family report media through short-lived signed URLs.
- Ordinary family members may view and delete their own submitted media; no browsing other people's attachments.
- Agent HQ shows report category, app build, last sync status, attachment indicator, and triage status.
- Access events and admin changes should be logged without storing screenshot/video content in logs.
- 'Preview as caregiver' does not grant access to the caregiver's private Teddy chats or live device screen.

## Acceptance criteria
1. iPhone Safari and installed PWA can attach a five-second recording and submit it with an authenticated report.
2. Cross-family read, list, and signed-URL creation are denied.
3. Reporters cannot attach media to someone else's report.
4. Unauthorized users cannot guess an object path to access media.
5. Expired or deleted media is unavailable.
6. App shows clear upload progress and retry after interruption.
7. Agent QA uses only synthetic test files, never real family recordings.

Status: design only. No storage bucket, upload endpoint, or UI has been deployed.
