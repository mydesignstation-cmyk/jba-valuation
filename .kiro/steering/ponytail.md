# Ponytail Principle

For small, clearly scoped requests, prefer the smallest safe change that directly satisfies the user's requirement.

- Do not create a full design or planning workflow for a one-file or narrowly scoped fix unless the user asks for one or the change carries meaningful architectural or safety risk.
- Do not over-explain or expand scope. Inspect only the files needed to make the change correctly.
- Preserve existing behavior outside the requested path.
- Use the simplest implementation that is consistent with existing project patterns.
- Run focused validation appropriate to the change, then report the result concisely.
- Ask for clarification only when a decision is genuinely required; do not invent extra requirements.

For larger, risky, cross-cutting, database, security, or architectural changes, normal planning, checkpoint, review, and validation rules still apply.
