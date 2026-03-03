# CodeQuill Snapshot & Publish Action

This GitHub Action automates the process of taking a snapshot and publishing your project using the CodeQuill CLI. It is designed to run in a non-interactive CI environment.

## Features

- Installs the CodeQuill CLI automatically.
- Executes codequill snapshot.
- Executes codequill publish with non-interactive flags.
- Waits for the publication transaction to complete.

## Usage

### Prerequisites

Before using this action, you must:
1. Enable CI integration for your repository in the CodeQuill app to obtain a `CODEQUILL_TOKEN`.
2. Add this token to your GitHub repository secrets (Settings > Secrets and variables > Actions) as `CODEQUILL_TOKEN`.

### Example Step

Add the following step to your GitHub Actions workflow:

```yaml
- name: CodeQuill Snapshot & Publish
  uses: ophelios-studio/codequill-action-publish@v1
  with:
    token: ${{ secrets.CODEQUILL_TOKEN }}
    github_id: ${{ github.repository_id }}
```

### Full Example

```yaml
name: Publish to CodeQuill

on:
  push:
    branches:
      - main

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: CodeQuill Snapshot & Publish
        uses: ophelios-studio/codequill-action-publish@v1
        with:
          token: ${{ secrets.CODEQUILL_TOKEN }}
          github_id: ${{ github.repository_id }}
```

## Inputs

| Input | Description | Required | Default              |
|-------|-------------|----------|----------------------|
| `token` | CodeQuill repo-scoped bearer token. | Yes |                      |
| `github_id` | GitHub repository numeric ID. | Yes | github.repository_id |
| `api_base_url` | Override CodeQuill API base URL. | No | ""                   |
| `cli_version` | npm version for codequill CLI. Leave empty for latest. | No | "" |
| `working_directory` | Working directory where CodeQuill commands run. | No | .                    |
| `extra_args` | Extra arguments appended to both commands. | No | ""                   |
| `preserve` | Preserve the code after publish. | No | "false" |

## How it works

1. The action installs the specified version (or latest) of the `codequill` CLI from npm.
2. It sets up the necessary environment variables (`CODEQUILL_TOKEN`, `CODEQUILL_GITHUB_ID`).
3. It runs `codequill snapshot` in the specified working directory.
4. It runs `codequill publish --no-confirm --json --no-wait`.
5. It parses the resulting transaction hash and runs `codequill wait` to ensure the process completes successfully on-chain.
6. If the `preserve` option is enabled, it calls `codequill preserve <snapshot_id> --json --no-wait` and waits for the preservation transaction to complete.
