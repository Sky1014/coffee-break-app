# Coffee Break ☕

**A cross-platform coffee break reminder that helps you step away from your screen.**

Work in focused 30-minute brewing sessions. When the timer ends, take a 60-second body reset — stretch, breathe, and come back refreshed.

---

## ✨ Features

### Desktop (Windows)
- **System tray app** — runs quietly in the background
- **Full-screen break overlay** — impossible to ignore
- **Auto pause/resume** — detects screen lock and adapts
- **Procedural audio** — synthesized coffee-pour sound effects (no audio files needed)
- **CSS animations** — smooth progress ring, coffee cup, and steam effects
- **Portable build** — no installer required, just run

### iOS / watchOS Prototype (Swift)
- **Pure functional state machine** — 11 states, 16 events, fully testable
- **3 break modes** — Gentle (45 min), Standard (35 min), Strict (25 min)
- **Snooze guardrail** — too many snoozes locks you into a mandatory break
- **Natural override detection** — detects when you naturally stand up
- **Daily summary** — track your break compliance over time
- **SwiftUI** — native iOS 17+ and watchOS 10+ interfaces

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
├── CoffeeBreakDesktop/     # Electron desktop app
│   ├── electron/           # Main process & preload scripts
│   ├── src/                # React frontend
│   ├── assets/             # Icons & audio
│   ├── scripts/            # Build & packaging scripts
│   └── package.json
│
└── CoffeeBreakPrototype/   # iOS/watchOS Swift prototype
    ├── Shared/             # Core state machine & models
    ├── iOSApp/             # iOS SwiftUI views
    ├── WatchApp/           # watchOS SwiftUI views
    └── Tests/              # Unit tests
```

---

## 🚀 Getting Started (Desktop)

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- npm 9+

### Install & Run
```bash
cd CoffeeBreakDesktop
npm install
npm run dev
```

### Build Portable Release
```bash
npm run package-portable
```

The portable `.exe` will be in `CoffeeBreakDesktop/release/`.

---

## 🧪 Running Tests (Swift Prototype)

Open `CoffeeBreakPrototype` as a local Swift package in Xcode, link `CoffeeBreakCore` to a test target, and run:

```bash
swift test
```

---

## 📋 Break Modes

| Mode | Work Interval | Vibe |
|------|--------------|------|
| Gentle | 45 min | Relaxed, for light workdays |
| Standard | 35 min | Balanced, the default |
| Strict | 25 min | Intense, for deep work sessions |

All modes enforce a 60-second break window.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Commit with a clear message (`git commit -m 'Add my feature'`)
5. Push to your fork (`git push origin feature/my-feature`)
6. Open a Pull Request

Please keep PRs focused and well-documented. If you're planning a large change, open an issue first to discuss.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
