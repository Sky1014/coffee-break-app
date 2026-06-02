# Coffee Break ☕

**A cross-platform coffee break reminder that helps you step away from your screen.**

Work in focused 30-minute brewing sessions. When the timer ends, take a 60-second body reset — stretch, breathe, and come back refreshed.

**[Download Windows Portable](https://github.com/Sky1014/coffee-break-app/releases/latest)** — no installer needed, just extract the zip and run.

---

## ✨ Features

### Desktop (Windows)
- **Settings window** — configure work/break durations, language, and more
- **System tray app** — runs quietly in the background
- **Full-screen break overlay** — impossible to ignore
- **Custom intervals** — adjustable work (5–120 min) and break (0.5–10 min) durations
- **Auto pause/resume** — detects screen lock and adapts
- **Procedural audio** — synthesized coffee-pour sound effects (can be muted)
- **CSS animations** — smooth progress ring, coffee cup, and steam effects
- **Bilingual** — English and Chinese (auto-detect, manual switch)
- **Launch at startup** — optional, configurable in settings
- **Portable + Installer** — extract-and-run ZIP, or NSIS setup with desktop shortcut

### iOS / watchOS (Work in Progress)
The mobile and watch prototype is under development. The core logic and SwiftUI skeleton are in place, but the full iOS/watchOS app is not yet complete.

**Contributions welcome!** If you're a Swift or iOS developer interested in helping bring Coffee Break to Apple platforms, feel free to open an issue or submit a pull request.

---

## 🛠️ Tech Stack

| Component | Tech |
|-----------|------|
| Desktop frontend | React 19 + TypeScript |
| Desktop runtime | Electron 33 |
| Build tooling | Vite 6, electron-builder |
| Mobile prototype | Swift 5.9, SwiftUI |
| Testing | XCTest (Swift) |

---

## 📁 Project Structure

```
coffee-break-app/
├── CoffeeBreakDesktop/     # Electron desktop app (Windows, ready)
│   ├── electron/           # Main process & preload scripts
│   ├── src/                # React frontend
│   ├── assets/             # Icons & audio
│   └── scripts/            # Build & packaging scripts
│
└── CoffeeBreakPrototype/   # iOS/watchOS Swift prototype (in progress)
    ├── Shared/             # Core state machine & models
    ├── iOSApp/             # iOS SwiftUI views
    ├── WatchApp/           # watchOS SwiftUI views
    └── Tests/              # Unit tests
```

---

## 🚀 Getting Started (Desktop)

**Option 1 — Installer (recommended):** Download `CoffeeBreak-x.x.x-Setup.exe` from the [Releases page](https://github.com/Sky1014/coffee-break-app/releases/latest), run it, and follow the wizard. Desktop shortcut and start menu entry are created automatically.

**Option 2 — Portable:** Download the ZIP, extract it anywhere, and run `CoffeeBreak.exe`. No installation needed.

**Requirements:** Windows 10/11 x64

For developers who want to build from source, Node.js 18+ is required. The desktop app uses Vite + Electron and can be run locally after installing dependencies.

---

## 🧪 Swift Prototype

Open `CoffeeBreakPrototype` as a local Swift package in Xcode and link `CoffeeBreakCore` to a test target to run the state machine unit tests.

---

## 📋 Break Modes

The desktop app supports fully customizable intervals via the settings window.

| Mode | Work Interval | Status |
|------|--------------|--------|
| Custom | 5–120 min (default 30 min) | ✅ Available |
| Custom break | 0.5–10 min (default 1 min) | ✅ Available |

---

## 🤝 Contributing

Contributions are welcome, especially for the iOS/watchOS side! Here's how to get involved:

1. Fork this repository
2. Create a feature branch
3. Make your changes and commit with a clear message
4. Push to your fork and open a Pull Request

If you're planning a large change, open an issue first to discuss. All skill levels welcome.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
