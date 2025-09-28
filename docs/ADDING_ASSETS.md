# Adding Assets (Images & Sounds)

This project uses a central asset catalogue and a simple AssetManager that preloads everything on startup and provides easy access by key.

## Quick workflow
1. Place your file under the assets folder
   - Images → `assets/images/`
   - Sounds → `assets/sounds/`
2. Register the asset in `scripts/core/asset_catalogue.js`
3. Use it in code with `assetManager.getImage('your_key')` or `assetManager.getSound('your_key')`
4. Refresh the game (assets preload on init)

---

## 1) Add files to the assets folder
- Supported images: PNG, JPG, etc.
- Supported sounds: MP3 (current project uses `.mp3`)
- Prefer lowercase names and hyphens or underscores: `laser-blue.png`, `ui_click.mp3`

## 2) Register in the catalogue
Edit `scripts/core/asset_catalogue.js` and add entries with a unique key.

Images example:
```js
images: {
  // ...existing
  "laser_blue": "assets/images/laser-blue.png",
  "asteroid": "assets/images/asteroid.png"
}
```

Sounds example:
```js
sounds: {
  // ...existing
  "laser_shot": "assets/sounds/laser_shot.mp3",
  "ui_click": "assets/sounds/ui_click.mp3"
}
```

Keys are how you’ll reference assets in code. Keep them short and descriptive.

## 3) Use assets in code
All assets are preloaded during `init()` via `assetManager.loadAllAssets(...)`. After loading completes, access them anywhere you have the `assetManager` instance.

Image usage:
```js
const img = assetManager.getImage('laser_blue');
if (img) {
  ctx.drawImage(img, x, y);
}
```

Sound usage:
```js
const sfx = assetManager.getSound('laser_shot');
if (sfx) {
  sfx.currentTime = 0; // rewind for rapid fire
  sfx.play();
}
```

Tip: Browsers often require a user interaction before playing audio. Your existing scenes already manage music and input—use sound effects in response to clicks/keys/game actions.

## 4) Replace or add ship/dock assets (optional)
If you add a new ship image and want it wired into `shipTypes`:
1. Add the image file (e.g., `assets/images/lander-viper.png`)
2. Register it with a key (e.g., `"lander_viper": "assets/images/lander-viper.png"`)
3. Add a new entry to `shipTypes` in `scripts/main.js`:
```js
shipTypes.viper = { src: 'assets/images/lander-viper.png', width: 80, height: 80, img: new Image(), thrusterOffset: 40 };
```
4. Update `linkAssetsToGameObjects()` in `scripts/main.js` to set the image after preload:
```js
shipTypes.viper.img = assetManager.getImage('lander_viper') || shipTypes.viper.img;
```
Now your new ship is available anywhere `shipTypes` is used.

## Live reload behavior
- Assets are loaded once at startup. If you add new keys to the catalogue, just refresh the page to preload them.
- If you need to load assets at runtime (on-demand), we can extend the AssetManager with a `loadImage`/`loadSound` API that returns a promise—ask if you want this.

## Troubleshooting
- 404 or path errors: Check the relative path in the catalogue matches the file under `assets/`.
- Missing or null assets: Confirm the key name matches exactly in both the catalogue and your code.
- Audio not playing: Ensure it’s triggered by a user gesture or that the page has already received interaction.
- Check status: Use `assetManager.isImageLoaded('key')` or `assetManager.isSoundLoaded('key')`. The console logs also show progress/failures.

## Advanced (optional next steps)
- Fallbacks: Define a placeholder image/sound and use it when a load fails.
- Validation: Warn on unused keys or missing files before starting the game.
- Dynamic packs: Load groups of assets per scene to speed up startup time.

That’s it—add the file, register it by key, use it via the AssetManager, and refresh!