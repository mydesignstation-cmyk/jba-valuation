# PR Review Request Policy

## Review Request

Whenever a pull request is created, **request a review from `@mydesignstation-cmyk`**.

### If requesting a review is supported:
- Use the GitHub API to request a review from `@mydesignstation-cmyk`
- Example PR API call includes: `-f reviewees="mydesignstation-cmyk"`

### If requesting a review is NOT supported:
- Add a comment on the PR mentioning `@mydesignstation-cmyk`
- Example comment: `cc @mydesignstation-cmyk for review`

## Merge Policy

**Do NOT merge automatically.** Wait for explicit review and approval from the user before merging any pull request.

## Implementation

When creating a pull request, add a comment to request review:

```bash
gh api repos/mydesignstation-cmyk/jba-valuation/issues/{PR_NUMBER}/comments -f body="cc @mydesignstation-cmyk for review" -X POST
```
