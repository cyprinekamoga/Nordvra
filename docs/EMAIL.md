# Email with Resend

The site sends every email through `lib/email` (`sendEmailSafe`). With `EMAIL_PROVIDER=console`
(the default) nothing is sent; with `EMAIL_PROVIDER=resend` it goes through Resend.

## 1. The domain: nordvra.se

1. Register `nordvra.se` at any .se registrar (Loopia, One.com, Namecheap, Hostinger …).
2. Decide where mail **to** info@nordvra.se is read. Resend only sends. Options: the
   registrar's own mailbox, Google Workspace or Zoho Mail, or free forwarding (e.g. ImprovMX) to
   an inbox you already use. Set up its MX records at the registrar.

## 2. Resend

1. Sign up at https://resend.com.
2. Domains → Add domain → `nordvra.se`, region **eu-west-1 (Ireland)** (data stays in the EU).
3. Resend shows DNS records (DKIM `resend._domainkey` TXT, and an MX + SPF TXT on the `send`
   subdomain). Add them exactly at the registrar. They don't clash with the mailbox's MX on the
   root domain. Optionally add DMARC: TXT `_dmarc` = `v=DMARC1; p=none;`.
4. Wait until the domain shows **Verified** (minutes to a few hours).
5. API Keys → Create → permission **Sending access**, domain `nordvra.se`. Copy the key
   (starts with `re_`); it is shown once.

## 3. Netlify environment variables

Site configuration → Environment variables (contexts: Production, Deploy previews, Branch
deploys):

| Variable | Value | Secret |
| --- | --- | --- |
| `EMAIL_PROVIDER` | `resend` | no |
| `EMAIL_FROM` | `Nordvra <info@nordvra.se>` | no |
| `EMAIL_REPLY_TO` | `info@nordvra.se` (or the inbox you read) | no |
| `RESEND_API_KEY` | the `re_…` key | **yes** |

Then redeploy (variables are read at runtime, but a new deploy makes sure every function has them).

## 4. Check

1. /admin/installningar → "E-post" should say "Skickas via Resend".
2. Press "Skicka testmejl" and check the inbox (and spam).
3. Set "E-post för notiser" in the same page to the inbox you read, so new requests, answered
   quotes and re-clean requests reach you.

Free plan limits: 3 000 emails a month, 100 a day. Logs never contain email bodies (they hold
quote links); only the recipient's domain and the subject are logged.
