# Affiliate Hub: mobile app

The affiliate-facing app, built with React Native on Expo SDK 58 and Expo Router, and shipped as an **Android APK**.

> The project overview, architecture, product decisions and next steps are in the **[backend README](../affiliate-backend/README.md)**, the main README for all three repos.

## What it does

- **Landing pitch**, driven entirely by `GET /api/program`: rate, minimum payout, what counts as a sale, how payouts work, how to join.
- **Sign-up in under a minute**: name, email, password, where you'll promote (plus an optional link). No payment details. It confirms instantly with "We've received your application".
- **Home**: application status (pending, or rejected with the reason). The referral code and link stay greyed out until approval, then get **Copy** and **Share** (native share sheet). A banner prompts for payout details once there are approved earnings and none are saved.
- **Earnings**: *Available for next payout* (and what's missing if it's ₹0: details or the minimum), Pending, Approved, Processing and Paid, plus the commission list with retry notes. There's no "withdraw" button: payouts are sent automatically in payout runs.
- **Payouts**: only payments finance confirmed, with date, amount, batch and payment reference.
- **Payout details**: UPI or bank account (name, account number entered twice, IFSC). They're shown masked afterwards (`UPI: ra***@okhdfc`, `Bank: ****4821`).
- Pull to refresh everywhere.

## Install the APK

Download the APK from this repo's **GitHub Releases**, open it on an Android phone and allow "install unknown apps" when prompted. It talks to the deployed backend, so you don't need to run anything locally. The first request can take ~30 s while the free-tier server wakes up.

Demo login: `affiliate@demo.com` / `demo1234`, or sign up as a new affiliate and approve yourself from the dashboard as `ops@demo.com`.

## Run in development

Requires Node.js ≥ 20.11 and the [backend](../affiliate-backend) running.

```bash
npm install
cp .env.example .env
#  Android emulator:  EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api
#  Physical phone:    EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:4000/api   (same Wi-Fi)
npx expo start          # then press "a" for an emulator or scan the QR code with Expo Go
```

Checks: `npm run lint`, `npm run typecheck`, `npx expo-doctor`.

## Build the APK (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest init                                   # links the project; adds the projectId to app.json
# set EXPO_PUBLIC_API_URL in eas.json → build.base.env to your deployed https backend
npx eas-cli@latest build -p android --profile preview     # buildType: apk
```

Download the APK from the build page, install it on a device to verify, then attach it to a GitHub Release.

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `.env` for development, `eas.json` for APK builds | Backend base URL including `/api`, inlined at build time. **Release builds refuse anything but `https://`.** |

## Design notes

- **Expo Router** with protected route groups: the pitch and auth screens for signed-out users, tabs plus payout details for signed-in users. The guards only shape navigation: the API authorises every request.
- The **JWT is stored in `expo-secure-store`** (Android Keystore-backed) and excluded from Android Auto Backup. It's never kept in plain AsyncStorage. A `401` from the API signs the user out.
- Bank and UPI details are sent once over HTTPS and stored encrypted on the server. The app only ever receives the masked form.
- Client-side validation mirrors the server's rules for instant feedback. The server re-validates everything.
- Money arrives as integer paise and is formatted for display only (Indian digit grouping).

```
src/
  app/                    routes (Expo Router)
    _layout.tsx           session provider, splash, protected groups
    welcome.tsx  signup.tsx  login.tsx
    (tabs)/               index (Home) · earnings · payouts · account
    payout-details.tsx    modal form
  components/             ui.tsx (Screen, Card, Button, Field, Banner, StatusPill…) · theme.ts
  lib/                    api.ts · session.tsx · useApi.ts · money.ts · validation.ts · config.ts · types.ts
```
