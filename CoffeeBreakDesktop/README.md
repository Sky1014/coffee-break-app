# Coffee Break Desktop

Windows desktop MVP for Coffee Break.

## Current MVP

- Runs as an Electron tray app.
- Starts a 30-minute brewing cycle when the app starts or Windows unlocks.
- Pauses and clears the cycle when Windows locks.
- Shows a centered always-on-top 60-second reset window.
- Supports snooze for 5 minutes and skip.
- Does not store history or analytics.

## Development

```powershell
npm.cmd install
npm.cmd run dev
```

Immediate popup test:

```powershell
npm.cmd run test-popup
```

Normal tray run:

```powershell
npm.cmd start
```
