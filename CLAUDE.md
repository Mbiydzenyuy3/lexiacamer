
# Lexia Cameroon

Offline-first React 18 + Vite PWA teaching children to read (phonics, spelling) with Cameroonian context. The app runs with no backend. Optional Supabase is an insert-only mailbox for tester signups and feedback. Maintainer-only scripts in `scripts/` hold the service-role key and the Meta token, and generate and schedule Facebook posts. **Risk: MEDIUM**. Re-assess to HIGH before any child data goes server-side. Project context lives in `.ai/` (local only, gitignored).

## Load only what the task needs
| Task | Load |
|---|---|
| UI / lesson content | `.ai/PROJECT.md` + touched files |
| Supabase table, migration, RLS | PROJECT + ARCHITECTURE + DATA_MODEL + VALIDATION_RULES + SECURITY + API_INVENTORY |
| Admin / Meta scripts | PROJECT + ARCHITECTURE + ENVIRONMENT + SECURITY + API_INVENTORY |
| Retry queues, store, business logic | PROJECT + BUSINESS_RULES + touched files |
| Anything with personal or children's data | add DOMAIN_KNOWLEDGE + THREAT_MODEL |
| Release | PRODUCTION_GATE |

Review depth: `.ai/REVIEW_RULES.md`. Before calling a task done, run `npm run lint`, `npm test` and `npm run build`.

**Scope discipline is mandatory.** Only modify what the current task requires. Any change outside that scope must be explicitly flagged in the final report as `⚠️ OUT-OF-SCOPE CHANGE: <file> — <reason>` — never included silently. Run the `scope-guardian` agent before declaring a task done.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
