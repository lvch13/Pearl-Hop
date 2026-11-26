// Pearl Hop native bridge: ads, saving and vibration inside the iPhone app.
// In a normal web browser this file just starts the game.
(function () {
  // ===== AdMob settings =========================================================
  // Your real iPhone rewarded ad unit is below. While USE_TEST_ADS is true, the app
  // shows Google's test ads instead (safe for TestFlight and for tapping).
  // For the App Store release build: set USE_TEST_ADS = false.
  const USE_TEST_ADS = false;
  const AD_UNIT_IOS_REAL = 'ca-app-pub-4466074981037210/7193731670';
  const AD_UNIT_IOS_TEST = 'ca-app-pub-3940256099942544/1712485313'; // Google's sample unit
  const AD_UNIT_IOS = USE_TEST_ADS ? AD_UNIT_IOS_TEST : AD_UNIT_IOS_REAL;
  // iPhone App ID (already in ios/App/App/Info.plist): ca-app-pub-4466074981037210~7709057793
  // Android (for the Google Play version later):
  //   App ID:            ca-app-pub-4466074981037210~4919242927
  //   Rewarded ad unit:  ca-app-pub-4466074981037210/2708012558
  // ==============================================================================

  const C = window.Capacitor;
  const native = !!(C && C.isNativePlatform && C.isNativePlatform());
  if (!native) { startGame(); return; }

  const AdMob = C.registerPlugin('AdMob');
  const Prefs = C.registerPlugin('Preferences');
  const Haptics = C.registerPlugin('Haptics');
  const KEY = 'pearlHop.v1';

  const later = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
  let ready = false, loading = null, abortCurrent = null;

  // Load an ad in the background. Never waits more than 10 seconds.
  function preload() {
    if (ready) return Promise.resolve();
    if (loading) return loading;
    const load = AdMob.prepareRewardVideoAd({ adId: AD_UNIT_IOS, isTesting: USE_TEST_ADS })
      .then(() => { ready = true; })
      .catch(() => { ready = false; });
    loading = Promise.race([load, later(10000)]).finally(() => { loading = null; });
    return loading;
  }

  // Resolves 'reward' (watched to the end), 'closed' (closed early or player went back)
  // or 'failed' (no ad available / ad would not open). It always finishes.
  function showRewarded() {
    return new Promise(async (resolve) => {
      let rewarded = false, shown = false, done = false, timer = null;
      const handles = [];
      const finish = (r) => {
        if (done) return; done = true; abortCurrent = null;
        clearTimeout(timer);
        handles.forEach((h) => { try { h.remove(); } catch (e) {} });
        setTimeout(preload, 800);
        resolve(r);
      };
      abortCurrent = () => { const r = rewarded ? 'reward' : 'closed'; finish(r); return r; };

      await Promise.race([preload(), later(8000)]);
      if (done) return;                       // player tapped "Go back" while loading
      if (!ready) return finish('failed');
      ready = false;

      const on = async (ev, fn) => { try { handles.push(await AdMob.addListener(ev, fn)); } catch (e) {} };
      await on('onRewardedVideoAdReward', () => { rewarded = true; });
      await on('onRewardedVideoAdShowed', () => { shown = true; });
      await on('onRewardedVideoAdDismissed', () => finish(rewarded ? 'reward' : 'closed'));
      await on('onRewardedVideoAdFailedToShow', () => finish('failed'));
      if (done) return;
      timer = setTimeout(() => { if (!shown) finish('failed'); }, 7000);   // ad never opened
      AdMob.showRewardVideoAd()
        .then(() => { rewarded = true; })
        .catch((e) => {
          const code = String((e && e.code) || '');
          if (code.includes('CANCEL')) finish(rewarded ? 'reward' : 'closed');
          else if (!shown) finish('failed');
        });
    });
  }

  window.PH = {
    persist: (k, v) => { Prefs.set({ key: k, value: v }).catch(() => {}); },
    haptic: (ms) => { Haptics.impact({ style: ms >= 100 ? 'HEAVY' : 'LIGHT' }).catch(() => {}); },
    showRewarded: async () => { try { return await showRewarded(); } catch (e) { return 'failed'; } },
    abort: () => (abortCurrent ? abortCurrent() : 'closed'),
  };

  (async () => {
    try { const r = await Prefs.get({ key: KEY }); if (r && r.value) localStorage.setItem(KEY, r.value); } catch (e) {}
    startGame();
    try {
      await AdMob.initialize({ tagForChildDirectedTreatment: true, maxAdContentRating: 'General', initializeForTesting: USE_TEST_ADS });
      preload();
    } catch (e) {}
  })();
})();
