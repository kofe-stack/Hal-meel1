# HalMeel Mobile App

Expo React Native productivity app for projects, ideas, tasks, calendar and profile.

## GitHub -> APK

This repository includes a GitHub Actions workflow at `.github/workflows/build-apk.yml`.

### 1. Upload the project files

Upload the **contents of this folder** to the root of your GitHub repository. Do not upload the ZIP as the only file.

### 2. Add the Expo token

In GitHub:

`Settings -> Secrets and variables -> Actions -> New repository secret`

Create:

`EXPO_TOKEN`

The value is an Expo access token created from your Expo account.

### 3. Build

Go to:

`Actions -> HalMeel - Android APK -> Run workflow`

The workflow will:

1. Checkout the repository.
2. Install Node.js.
3. Install dependencies with `npm install` (no package-lock is required).
4. Install the latest EAS CLI.
5. Verify the Expo token.
6. Build the Android APK using the `preview` profile.
7. Download the finished APK.
8. Upload `HalMeel.apk` as a GitHub Actions artifact.

### 4. Download the APK

Open the completed workflow run and use:

`Artifacts -> HalMeel-Android-APK`

## Local Expo test

```bash
npm install
npx expo start --tunnel
```

## Important

The GitHub Actions build still depends on a valid Expo account/token and the availability of Expo EAS. No workflow can guarantee success if credentials or the remote build service are unavailable.
