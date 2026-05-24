Scan the current codebase and update the following markdown files to reflect what actually exists — not what should exist, not what was planned. Only document what IS here right now.

Files to update:

1. **CLAUDE.md** — Update the stack versions, env vars, and hard rules sections if anything has changed. Do not touch the personal context or work style sections.

2. **CONTEXT.md** — Rebuild the routing table and source tree from the actual files in `src/`. Update the auth flow, invite flow, and household flow sections if the code has changed.

3. **docs/SPEC.md** — Update the "Built" vs "Not built" feature lists. Move anything that was "not built" to "built" if it now exists in the codebase.

4. **docs/SCHEMA.md** — Update the table definitions to match any new columns, tables, or indexes that have been added. Include the migration SQL for any new columns.

5. **docs/decisions/001-current-architecture.md** — Add any new architectural decisions made since the last update. Do not remove existing decisions.

Rules:
- Read the actual source files before writing. Do not guess.
- Do not invent features that don't exist.
- Do not remove documented decisions — only add new ones.
- Keep the same format and tone as the existing files.
- After updating, summarize what changed in each file in 1 line each.
