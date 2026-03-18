# Expo Go Mobile Testing

This app can be tested on mobile devices using Expo Go.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Expo CLI globally (if not already installed):
   ```bash
   npm install -g @expo/cli
   ```

## Running on Mobile

### Option 1: Expo Web (Recommended)
Start the development server with Expo and scan the QR code:

```bash
npm run expo:web
```

This will:
- Start the Vite dev server
- Display a QR code in the terminal
- You can scan the QR code with your phone's camera (iOS) or Expo Go app (Android)

### Option 2: Expo Start
```bash
npm run expo:start
```

Then press:
- `w` to open in web browser
- `i` to open in iOS simulator (Mac only)
- `a` to open in Android emulator

### Option 3: Direct Platform
```bash
npm run expo:android  # Android
npm run expo:ios      # iOS (Mac only)
```

## Using Expo Go App

1. Download the **Expo Go** app from App Store (iOS) or Play Store (Android)
2. Make sure your phone is on the same WiFi network as your computer
3. Scan the QR code displayed in the terminal
4. The app will open in Expo Go

## Notes

- This is a web app built with Vite + React
- Expo Go runs the web version of the app
- Some native features may not be available in Expo Go
- For full native functionality, build a standalone app with EAS

## Troubleshooting

**QR code not scanning?**
- Make sure your phone and computer are on the same WiFi network
- Try using the "Tunnel" connection type by pressing `t` in the terminal

**App not loading?**
- Check that the dev server is running on the displayed URL
- Try accessing the URL directly in your phone's browser

**Port already in use?**
- Expo will automatically try different ports (19000, 19001, etc.)
