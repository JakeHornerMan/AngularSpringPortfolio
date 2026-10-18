# Deployment plan: jakedev.win on AWS + Cloudflare

Goal: replace the current jakedev.win with this dynamic portfolio. The Angular frontend goes on S3, the Spring Boot API on EC2, MySQL on RDS, and the domain stays on Cloudflare.

## Accounts

- **Cloudflare:** the domain lives in the Cloudflare account `jakehornerwork@gmail.com`. Dashboard: https://dash.cloudflare.com/0086a27eb9d928f2fcb1d129aacb2723/domains/overview
- **AWS:** account and region still to be confirmed. The old prod IP (54.74.141.140) suggests eu-west-1.

## Architecture

```
browser ── https://jakedev.win ──► Cloudflare ──► S3 bucket "jakedev.win" (Angular build)
        └─ https://api.jakedev.win ► Cloudflare Tunnel ──► EC2 (Spring Boot :8080) ──► RDS MySQL (private)
```

- **Frontend: S3 behind Cloudflare.** S3 website hosting has no HTTPS of its own, but the Cloudflare proxy adds it.
  - The bucket must be named exactly `jakedev.win`.
  - The error document is set to `index.html`, so deep links like `/interest/2` still load the SPA.
- **Backend: EC2 behind a Cloudflare Tunnel.** `cloudflared` on the instance connects outbound to Cloudflare.
  - That gives `https://api.jakedev.win` with a valid certificate, no open inbound ports, and no certificates on the box.
  - HTTPS is mandatory. The old prod config called `http://54.74.141.140:8080`, and browsers block plain-HTTP calls from an HTTPS page (mixed content). That was likely part of the original failure, alongside the CORS bug.
- **Database: RDS MySQL.** No public access. Only the EC2 security group can reach it on port 3306. The password is stored in AWS Secrets Manager, not in `application.properties`.

## Code changes needed before deploying

1. **CORS** (`MySecurityConfig`): allow the origin `https://jakedev.win` (keep `http://localhost:4200` for dev). Allow the headers `Content-Type` and `Authorization`, and handle the OPTIONS preflight. The current config only allows `Authorization`, so every JSON write fails the preflight.
2. **Lock down writes:** require authentication for every `POST /save`, `PUT /update` and `PUT /delete/{id}` on `/projects`, `/workExperience` and `/interests`. Close `/register` once the owner account exists.
3. **Externalise config:** read the DB URL, user and password from environment variables, and delete the broken YAML-style `server.ssl` block from `application.properties`.
4. **Frontend:** set `apiBaseUrl` in `environment.prod.ts` to `https://api.jakedev.win`.
5. **Scripts:**
   - build the jar and the Angular production build;
   - an EC2 setup script that installs Java 11 (Corretto) and a `systemd` service, so the API restarts on crash or reboot.

## Who does what

| Step | Claude | Jake |
|---|---|---|
| Install AWS CLI and `cloudflared` | Provides the commands | Runs the installers (`winget install Amazon.AWSCLI`) |
| AWS login | — | Runs `aws configure` or `aws sso login`. Access keys are never shared with Claude. |
| Create EC2, RDS, S3, security groups and secret | Runs the CLI commands after the cost is approved | Approves |
| Upload the site, deploy the jar, run EC2 setup | Does it | — |
| Cloudflare DNS and tunnel | Runs the `cloudflared` commands | Approves the browser login, and confirms jakedev.win is listed in the Cloudflare dashboard |
| Admin account | Closes `/register` afterwards | Registers once |
| Commit and push | Never | Always Jake |

## Rough monthly cost (eu-west-1, Ireland)

| Item | Approx. cost per month |
|---|---|
| EC2 t4g.micro | $6 |
| RDS db.t4g.micro | $13 |
| Public IPv4 address | $3.60 |
| S3 | pennies |
| **Total** | **about $23** (less while on the 12-month free tier) |

A cheaper option is to run MySQL on the EC2 instead of RDS. That saves about $13 a month but gives up managed backups.

## Order of work

1. **Code changes** (above), tested locally against the mock API. No AWS needed.
2. **AWS CLI:** Jake installs it, logs in and picks the region.
3. **Create the AWS resources and deploy.** The exact resources are listed for approval first.
4. **Cloudflare:** set up the tunnel and `api.jakedev.win`, then switch the `jakedev.win` DNS to the S3 bucket as the very last step. The current site stays live until then, so there's no downtime and rollback is easy.

## Status

- [ ] 1. Code changes
- [ ] 2. AWS CLI installed and logged in
- [ ] 3. AWS resources created and app deployed
- [ ] 4. Cloudflare tunnel and DNS switched
