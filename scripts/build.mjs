// Builds www/ (what goes inside the app) from src/game.html.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const p = (s) => root + s;
let g = readFileSync(p('src/game.html'), 'utf8');
const swap = (from, to) => { if (!g.includes(from)) throw new Error('Build step failed, could not find: ' + from.slice(0, 80)); g = g.replace(from, to); };

// Drop the web-only head bits; fonts are bundled locally instead of Google Fonts.
g = g.replace(/<title>.*?<\/title>\s*/, '').replace(/<meta name="claude:[^>]*>\s*/, '').replace(/<link rel="stylesheet" href="https:\/\/fonts[^>]*>\s*/, '');
// Run the game after saved progress is restored.
swap('<script>\n(()=>{', '<script>\nfunction startGame(){');
swap("requestAnimationFrame(loop);\n})();\n</script>", "requestAnimationFrame(loop);\n}\n</script>");
// Save to the phone as well as the web view.
swap("const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};",
     "const save=()=>{const j=JSON.stringify(S);try{localStorage.setItem(KEY,j)}catch(e){}if(window.PH)PH.persist(KEY,j)};");
// Real vibration.
swap("const buzz=ms=>{", "const buzz=ms=>{if(window.PH){PH.haptic(ms);return}");
// Real rewarded ads.
swap("function playAd(done){", "function playAd(done,back){if(window.PH){show('ad');$('adTag').textContent='Ad';$('adText').textContent='Loading your reward…';$('adCount').textContent='';"
  + "let settled=false;const bk=$('adBack');bk.hidden=true;const bt=setTimeout(()=>{bk.hidden=false},4000);"
  + "const fin=r=>{if(settled)return;settled=true;clearTimeout(bt);bk.hidden=true;"
  + "if(r==='reward')done();else if(r==='failed'){done();toast('No ad right now, so this one is free!')}else{back();toast('Watch to the end to get the reward')}};"
  + "bk.onclick=()=>{SFX.click();fin(PH.abort())};PH.showRewarded().then(fin,()=>fin('failed'));return}");
swap("toast('Keep swimming!')})};", "toast('Keep swimming!')},()=>show('cont'))};");
swap("toast('Pearls doubled!');SFX.gold()})};", "toast('Pearls doubled!');SFX.gold()},()=>show('over'))};");
swap("show('chest');SFX.gold()})};", "show('chest');SFX.gold()},()=>show('chest'))};");
swap('<div class="ad-tag">Ad placeholder</div>', '<div class="ad-tag" id="adTag">Ad placeholder</div>');
swap('<p>In the iPhone app, a real AdMob rewarded ad plays here.</p>', '<p id="adText">In the iPhone app, a real AdMob rewarded ad plays here.</p>');

const fonts = `@font-face{font-family:"Fredoka";font-weight:500;font-display:swap;src:url(fonts/fredoka-500.woff2) format("woff2")}
@font-face{font-family:"Fredoka";font-weight:700;font-display:swap;src:url(fonts/fredoka-700.woff2) format("woff2")}
@font-face{font-family:"Pacifico";font-weight:400;font-display:swap;src:url(fonts/pacifico-400.woff2) format("woff2")}
@font-face{font-family:"Nunito";font-weight:700;font-display:swap;src:url(fonts/nunito-700.woff2) format("woff2")}
@font-face{font-family:"Nunito";font-weight:800;font-display:swap;src:url(fonts/nunito-800.woff2) format("woff2")}
html{box-sizing:border-box;height:100%;background:#06283d;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);-webkit-text-size-adjust:100%}
body{margin:0;font-size:14px;-webkit-touch-callout:none;overscroll-behavior:none}
img{max-width:100%}`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<title>Pearl Hop</title>
<style>
${fonts}
</style>
</head>
<body>
${g.trim()}
<script src="capacitor.js"></script>
<script src="native.js"></script>
</body>
</html>
`;
rmSync(p('www'), { recursive: true, force: true });
mkdirSync(p('www/fonts'), { recursive: true });
writeFileSync(p('www/index.html'), html);
copyFileSync(p('src/native.js'), p('www/native.js'));
copyFileSync(p('node_modules/@capacitor/core/dist/capacitor.js'), p('www/capacitor.js'));
for (const [f, w] of [['fredoka', 500], ['fredoka', 700], ['nunito', 700], ['nunito', 800], ['pacifico', 400]])
  copyFileSync(p(`node_modules/@fontsource/${f}/files/${f}-latin-${w}-normal.woff2`), p(`www/fonts/${f}-${w}.woff2`));
console.log('Built www/ for Pearl Hop');
