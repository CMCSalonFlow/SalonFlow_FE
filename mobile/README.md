# SalonFlow Mobile

This folder is a separate React Native app for the customer experience.

It is intentionally isolated from the web app at the repo root, so the current Vite
web source remains unchanged.

## Structure

- `mobile/App.js`: native entry UI
- `mobile/src/screens`: customer screens
- `mobile/src/components`: shared mobile UI building blocks
- `mobile/src/shared/api`: API helper for backend calls

## Run

From the repo root:

```bash
npm run mobile:start
```

Or run Expo directly inside `mobile/` after dependencies are installed:

```bash
npm install
npm start
```

## Notes

- Set `EXPO_PUBLIC_API_BASE_URL` to point to the same backend used by the web app.
- This scaffold is a starting point; we can now move customer flows screen by screen into mobile.

