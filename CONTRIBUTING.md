# Contributing Guide

## Development Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Quality Expectations

Before submitting changes:

```bash
npm run check
```

## Contribution Standards

- keep TypeScript strictly typed
- avoid placeholder implementations
- avoid committing secrets
- document major architectural changes
- preserve UX consistency
- prefer maintainable abstractions over quick hacks

## Pull Request Checklist

- build passes
- no broken imports
- environment variables documented
- feature documented if user-facing
