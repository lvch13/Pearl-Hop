# Pearl Hop: iPhone app

The game is in `src/game.html`. Brand files (BOTG Games logos and icon concepts) are in `brand/`. `npm run build` turns it into the app's web files (`www/`), and Capacitor wraps those as a real iPhone app (`ios/`).

## One-time Mac setup
1. Install **Xcode** from the Mac App Store. Open it once and let it install its extra parts.
2. In Xcode: **Settings → Accounts → +** and sign in with your Apple Developer Apple ID.
3. Install **Node.js** (the LTS version) from https://nodejs.org

## Get the project (first time only)
```
cd ~/Documents
git clone https://github.com/lvch13/pearl-hop.git pearl-hop-app
cd pearl-hop-app
npm install
npm run ios
```
`npm run ios` builds the game, copies it into the iPhone project and opens Xcode.
The first time, Xcode downloads Google's ad library, which takes a few minutes. Wait until the progress bar at the top finishes.

## Signing (first time only)
In Xcode, click **App** at the top of the left sidebar, then the **App** target, then **Signing & Capabilities**:
- Tick **Automatically manage signing**
- **Team**: choose your developer account
- **Bundle Identifier**: `com.laura.pearlhop`. If Xcode says it's unavailable, change it to something else unique, such as `com.laura.pearlhopgame`.

## Create the app in App Store Connect (first time only)
appstoreconnect.apple.com → **Apps → + → New App**
- Platform: iOS · Name: **Pearl Hop** · Language: English (U.S.)
- Bundle ID: pick the one from Xcode in the list · SKU: `pearlhop001` · Full Access

## Upload to TestFlight
1. In Xcode's top bar, set the device to **Any iOS Device (arm64)**
2. **Product → Archive**
3. When the Organizer window opens: **Distribute App → App Store Connect → Distribute**
4. In App Store Connect → Pearl Hop → **TestFlight**, the build shows "Processing" for 10–30 minutes.
5. Under **Internal Testing**, click **+**, make a group, and add yourself.
6. On your iPhone, install the **TestFlight** app, accept the invite and tap **Install**.

## Every update after that
```
cd ~/Documents/pearl-hop-app
git pull
npm install
npm run ios
```
The Build number is already raised in each update. In Xcode: **Product → Archive → Distribute App → App Store Connect → Distribute**.

## Ads
Your AdMob IDs are already in the app:
- iPhone App ID `ca-app-pub-4466074981037210~7709057793` in `ios/App/App/Info.plist`
- iPhone rewarded ad unit `ca-app-pub-4466074981037210/7193731670` in `src/native.js`

`USE_TEST_ADS = true` in `src/native.js` means Google's test ads show (with a "Test Ad" label). Keep it that way for TestFlight.

**For the App Store release build only:** open `src/native.js`, change `USE_TEST_ADS = true` to `USE_TEST_ADS = false`, save, then `npm run ios`, raise the Build number, Archive and upload.

Never tap your own real ads, because it can get your AdMob account banned.
