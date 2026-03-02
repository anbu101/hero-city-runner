# How To Run Hero City Runner

## Run on Laptop

1. Open a terminal in the project folder:
   ```bash
   cd /Users/anbu/dev/hero-city-runner
   ```
2. Install dependencies (first time only):
   ```bash
   npm install
   ```
3. Start the app (recommended):
   ```bash
   npm run dev
   ```
4. Open in browser:
   - http://localhost:5173

## Run on Phone (same Wi-Fi)

1. Use stable phone mode (recommended):
   ```bash
   /Users/anbu/dev/hero-city-runner/scripts/start-phone.sh
   ```
2. On phone browser, open URL printed by the script:
   - Example: `http://192.168.1.10:4173`
4. Ensure phone and laptop are on the same Wi-Fi network.
5. If Safari says server not responding:
   - Verify Mac firewall allows incoming connections for Terminal/Node.
   - Re-run the script and keep terminal open.

## iPhone Full-Screen (Home Screen App)

1. Open the game URL in Safari on iPhone.
2. Tap Share.
3. Tap **Add to Home Screen**.
4. Launch from home icon for near-app experience.

## If You See Only Blue Screen

1. Hard refresh browser:
   - Mac Chrome: `Cmd + Shift + R`
2. Stop and restart dev server.
3. Check terminal for runtime errors.
4. If phone still fails, verify the laptop IP and same Wi-Fi network.

## Production Build

Create production build:
```bash
npm run build
```

Preview production build locally:
```bash
npm run preview
```

Then open:
- http://localhost:4173
- or from phone: `http://<YOUR_LAPTOP_IP>:4173`
