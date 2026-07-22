# SalonFlow Mobile

This folder is a separate customer app built with Expo Router + NativeWind.

The web app at the repo root stays untouched.

## Structure

- `mobile/app`: file-based routes
- `mobile/src/components`: shared mobile UI
- `mobile/src/shared/api`: mobile API helper and endpoint map

## Run

From the repo root:

```bash
npm run mobile:start
```

## API base URL

- Android emulator: defaults to `http://10.0.2.2:9090`
- iOS simulator: defaults to `http://localhost:9090`
- Real phone: set `EXPO_PUBLIC_API_BASE_URL` to your Windows LAN IP or a staging domain

Example:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://192.168.1.10:9090"
npm run mobile:start
```

## Notes

- The mobile app uses its own API helper, so it does not depend on the web axios interceptor.
- You can now migrate customer flows screen by screen without touching the web UI.
