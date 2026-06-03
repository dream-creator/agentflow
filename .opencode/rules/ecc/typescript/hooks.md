# TypeScript/JavaScript Development Hooks

> Extends common development workflow patterns with TypeScript/JavaScript specific tooling.

## Post-Edit Checks

After editing JS/TS files, ensure:

- **Prettier**: Auto-format JS/TS files after edit
- **TypeScript check**: Run `tsc` after editing `.ts`/`.tsx` files
- **console.log warning**: Remove `console.log` from production code before committing

## Pre-Commit Checks

- **console.log audit**: Check all modified files for `console.log` before committing
