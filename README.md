# Affiliate Hub: mobile app

The app affiliates use to sign up, share their referral link, track earnings and see payouts. Built with React Native, Expo SDK 58 and Expo Router, and shipped as an **Android APK**.

**Related repos:** [affiliate-backend](https://github.com/rahul-312/affiliate-backend) (the API) · [affiliate-frontend](https://github.com/rahul-312/affiliate-frontend) (dashboard for ops and finance)

---

## Option A: Just install the APK

You don't need to run anything locally. The APK talks to the deployed backend.

1. On an Android phone, open this repo's **GitHub Releases** page and download the latest `.apk`.
2. Open the file. If Android asks, allow **Install unknown apps** for your browser.
3. Open **Affiliate Hub** and sign in with `affiliate@demo.com` / `demo1234`, or sign up as a new affiliate.

The first request can take about 30 seconds while the free-tier server wakes up.

To get a new sign-up approved, sign in to the dashboard as `ops@demo.com` / `demo1234` and approve it under **Affiliates**. Then pull down to refresh in the app.

---

## Option B: Run it from source

### Before you start

| You need | Check it with |
| --- | --- |
| Node.js 22 (anything ≥ 20.11 works) | `node -v` |
| The backend running | Open <http://localhost:4000/api/health>. You should see `{"status":"ok","db":"up"}` |
| **One** of: an Android emulator ([Android Studio](https://developer.android.com/studio)) **or** an Android phone with the **Expo Go** app | |

If the backend isn't running yet, follow the setup steps in the [backend README](https://github.com/rahul-312/affiliate-backend#setup) first.

Run every command from inside the `affiliate-mobile` folder.

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and set `EXPO_PUBLIC_API_URL` for the device you'll use:

| Device | Value |
| --- | --- |
| Android emulator | `http://10.0.2.2:4000/api` (the default; `10.0.2.2` is how the emulator reaches your computer) |
| Real phone | `http://<your computer's IP>:4000/api`, for example `http://192.168.1.20:4000/api`. The phone and computer must be on the same Wi-Fi |

To find your computer's IP, run `ipconfig` on Windows (look for **IPv4 Address**) or `ipconfig getifaddr en0` on macOS.

### Step 3: Start the app

```bash
npx expo start
```

When the QR code appears:

- **Emulator**: start the emulator first, then press `a` in the terminal.
- **Real phone**: open Expo Go and scan the QR code.

Sign in with `affiliate@demo.com` / `demo1234`.

---

## Commands

| Command | What it does |
| --- | --- |
| `npx expo start` | Starts the development server |
| `npm run android` | Starts the server and opens the app on the emulator |
| `npm run lint` | Checks code style |
| `npm run typecheck` | Checks TypeScript types |
| `npm run doctor` | Checks the Expo project for setup problems |
| `npm run build:apk` | Builds the APK on EAS (see below) |

---

## Environment variables

| Variable | Where to set it | What it's for |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `.env` when developing; `eas.json` (`build.base.env`) for APK builds | Backend URL, including `/api`. Baked in at build time. **APK builds only accept `https://` URLs** |

---

## Common problems

| You see | Fix |
| --- | --- |
| `Network request failed` on a real phone | Check that `EXPO_PUBLIC_API_URL` uses your computer's IP (not `localhost`) and that both devices are on the same Wi-Fi. Windows Firewall may also be blocking port 4000; allow Node.js through it |
| `Network request failed` on the emulator | Use `http://10.0.2.2:4000/api`, not `localhost` |
| Changed `.env` but the app still uses the old URL | Stop Expo and run `npx expo start -c` to clear the cache |
| Pressing `a` says no device was found | Start the emulator from Android Studio's Device Manager first |
| Login says the email or password is wrong | Run `npm run seed` in the backend to load the demo accounts |

---

## Building the APK

The APK is built in the cloud with EAS, so you don't need Android Studio for this.

1. Sign in to Expo (create a free account at expo.dev if needed):

   ```bash
   npx eas-cli@latest login
   ```

2. Link the project. This adds a `projectId` to `app.json`. You only need to do this once:

   ```bash
   npx eas-cli@latest init
   ```

3. In `eas.json`, set `build.base.env.EXPO_PUBLIC_API_URL` to your deployed backend, for example `https://affiliate-backend.onrender.com/api`.
4. Start the build:

   ```bash
   npm run build:apk
   ```

5. When it finishes, download the APK from the link EAS prints, install it on a phone, and check that you can sign in.
6. Attach the APK to a new **GitHub Release** on this repo.

---

## What's in the app

- **Welcome**: the program pitch (rate, minimum payout, what counts as a sale, how payouts work), all loaded from `GET /api/program`.
- **Sign up**: name, email, password and where you'll promote, plus an optional link. No payment details. It confirms straight away with "We've received your application".
- **Home**: application status (pending, or rejected with the reason). The referral code and link stay greyed out until you're approved, then you can **Copy** and **Share** them. A banner asks for payout details once you have approved earnings and none are saved.
- **Earnings**: *Available for next payout* (and why it's ₹0, if it is), plus Pending, Approved, Processing and Paid totals and the commission list. There's no "withdraw" button, because finance pays everyone in payout runs.
- **Payouts**: payments finance has confirmed, with date, amount, batch and payment reference.
- **Payout details**: UPI or bank account (name, account number typed twice, IFSC). Shown masked afterwards, like `UPI: ra***@okhdfc` or `Bank: ****4821`.
- **Account**: pause your account and resume it later.
- Pull to refresh on every screen.

## How it works

- **Expo Router** with protected route groups: signed-out users see the welcome and auth screens; signed-in users see the tabs and payout details. The API still checks every request.
- **Token storage.** The JWT is stored in `expo-secure-store` (backed by the Android Keystore) and excluded from Android backups. A `401` from the API signs the user out.
- **Payout details.** Sent once over HTTPS and stored encrypted on the server. The app only ever receives the masked form.
- **Validation.** Forms check input on the phone for quick feedback, and the server checks everything again.
- **Money.** The API sends whole-number paise, which the app formats with Indian digit grouping.

## Key decisions and tradeoffs

| Decision | Why | Tradeoff |
| --- | --- | --- |
| **Expo + EAS builds** | A signed APK without setting up Android tooling locally | Depends on Expo's build service |
| **Android APK only** | Fastest way to get the app onto real phones for v1 | No iOS build yet |
| **No bank details at sign-up** | A shorter form gets more sign-ups and builds trust | Affiliates must come back to add details before they're paid |
| **Referral link locked until approval** | Unvetted accounts can't earn | New affiliates wait for ops before they can share |
| **No "withdraw" button** | Finance pays everyone in payout runs, so there's nothing to request | Affiliates can't choose when they get paid |
| **Pitch loaded from the API** | Rate and rules can change without a new APK | The welcome screen needs the network |
| **Token in secure storage (Android Keystore)** | The login token is protected on the phone | Slightly more setup than plain storage |

## What we'd add with more time

- **Push notifications** when you're approved, earn a commission or get paid
- **iOS build** for the App Store
- **Referral stats**: clicks, sales and conversion rate for your link
- **Earnings charts** over time
- **Over-the-air updates** (EAS Update), so fixes reach users without a new APK
- **Fingerprint or face unlock** for signing in

## Project layout

```text
src/
  app/                    screens (Expo Router)
    _layout.tsx           session provider, splash screen, protected groups
    welcome.tsx, how-it-works.tsx, signup.tsx, login.tsx
    (tabs)/               index (Home), earnings, payouts, account
    payout-details.tsx    payout details form
  components/             ui.tsx (Screen, Card, Button, Field, Banner, StatusPill…), theme.ts
  lib/                    api.ts, session.tsx, useApi.ts, money.ts, validation.ts, config.ts, types.ts
```
