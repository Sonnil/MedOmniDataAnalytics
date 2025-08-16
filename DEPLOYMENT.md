# GoDaddy FTP Deployment (via GitHub Actions)

This repo deploys the static site to GoDaddy using a GitHub Actions workflow on push to `main`.

## Required repository secrets
Add these in GitHub: Settings → Secrets and variables → Actions → New repository secret.

- `FTP_SERVER` — e.g. `ftp.yourdomain.com`
- `FTP_USERNAME` — your GoDaddy FTP/cPanel user
- `FTP_PASSWORD` — your FTP password
- `FTP_REMOTE_DIR` — target directory on the server, must exist and end with a slash. Examples:
  - `public_html/` (root web directory)
  - `public_html/subfolder/`

## What gets deployed
- The site root (this folder) is uploaded.
- Exclusions:
  - `.github/**` (workflows)
  - `library-proxy/**`
  - `node_modules/**`
  - `*.lock`, `README*.md`, `.DS_Store`

Edit `.github/workflows/deploy-godaddy.yml` to customize.

## Triggering a deploy
- Push to `main` to start deployment.
- Check progress in GitHub → Actions.

## Tips
- If your host requires FTPS (explicit TLS), set it on the action with `protocol: ftps`.
- Ensure the `FTP_REMOTE_DIR` exists on the server. The action won't create it.
- If you want a clean upload (remove server files not in git), uncomment `dangerous-clean-slate` in the workflow.
