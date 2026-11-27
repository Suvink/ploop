# Ploop

_Every flight as a little story._

Ploop is a flight log for Android that works offline. Scan a boarding pass (or type a flight in) and Ploop turns your trips into a passport: stats, country stamps, a route map and shareable story images.

- **Private by design.** No accounts, no servers, no analytics. Your flights stay on your phone and are never sent anywhere. The app is free and shows a few native ads (Google AdMob); see `src/ads/`.
- **Scan and go.** Point the camera at a boarding-pass barcode, or pick a screenshot. Flights save straight away; passenger name and booking reference are never stored.
- **Your passport.** A swipeable passport with a data page, visa stamps for every country, records and fun facts. Save any page as an image.
- **Stories.** Three 1080×1920 templates (Passport, Map, Flight) in three themes, ready for Instagram.
- **Backups.** Export and import everything as a JSON file from Settings.

## Getting started

You need Node 22+ and an Android phone with USB debugging (or an emulator).

```bash
npm install
npx expo run:android   # builds the development app, installs it and starts Metro
```

After the first build, `npm start` is enough. Expo Go isn't supported because Ploop uses native modules (barcode scanner, view capture).

In a development build, **Settings → Load Demo Data** adds about 120 sample flights.

## Scripts

| Command                                                              | What it does                                                          |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `npm start`                                                          | Start Metro for the development app                                   |
| `npm test`                                                           | Run the tests                                                         |
| `npm run lint`                                                       | Lint                                                                  |
| `npm run typecheck`                                                  | TypeScript check                                                      |
| `npm run db:generate`                                                | Create a migration after editing `src/db/schema.ts`                   |
| `npm run data:airports`, `data:airlines`, `data:logos`, `data:atlas` | Rebuild bundled reference data (needs network; outputs are committed) |

The app version lives in `package.json` only (`npm version patch|minor|major`). `app.config.js` passes it to Expo and derives Android's `versionCode` from it (1.2.3 → 10203).

## Building for release

Builds run on [EAS](https://docs.expo.dev/build/introduction/). Profiles are in `eas.json`:

| Profile       | Output | Use                                                     |
| ------------- | ------ | ------------------------------------------------------- |
| `development` | APK    | Development app for testing on your phone               |
| `preview`     | APK    | Release build to install directly or share with testers |
| `production`  | AAB    | Upload to Google Play                                   |
| `no-ads`      | APK    | Like `preview`, with ads switched off                   |

```bash
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
```

### Ads (AdMob)

Development builds always show Google's test ads. For real ads, create an Android app and a **Native advanced** ad unit in [AdMob](https://admob.google.com), then add two EAS environment variables for the `production` (and `preview`) environment:

```bash
npx eas-cli env:create --environment production --name ADMOB_ANDROID_APP_ID --value "ca-app-pub-…~…" --visibility plaintext
npx eas-cli env:create --environment production --name EXPO_PUBLIC_ADMOB_NATIVE_UNIT --value "ca-app-pub-…/…" --visibility plaintext
```

Without them a release build falls back to test ads. Also set up a GDPR consent message in AdMob → Privacy & messaging; the app shows it where required.

### Build it without ads

Ploop is free and open source. If you'd rather not see ads, build your own copy with them switched off and install it on your phone:

```bash
git clone https://github.com/Suvink/ploop.git && cd ploop
npm install
EXPO_PUBLIC_ADS=off npx expo run:android --variant release
```

Connect your phone with USB debugging on first. Or build an APK on EAS (free account) and install it from the link:

```bash
npx eas-cli build --platform android --profile no-ads
```

Everything else works exactly the same.

## Project structure

```
app/              Screens (Expo Router)
src/components/   UI components
src/lib/          Core logic: boarding-pass parser, stats, dates, backups (unit tested)
src/db/           SQLite schema, migrations and queries (Drizzle)
src/stories/      Story image templates and export
src/theme/        Colours, fonts and spacing
src/ads/          AdMob native ads: themed ad card, offline-safe cache, consent
scripts/          Build-time data scripts
assets/           Fonts, images, airline logos and bundled reference data
```

## Credits

- **Airports:** [OurAirports](https://ourairports.com/data/) (public domain)
- **Airlines:** [Wikidata](https://www.wikidata.org/) (CC0)
- **Map outlines:** Natural Earth via [world-atlas](https://github.com/topojson/world-atlas) (public domain)
- **Fonts:** Plus Jakarta Sans, Inter and Fredoka (SIL Open Font License, see `assets/fonts/`)
- **Icons:** Feather (MIT)
- **Airline logos:** trademarks of their respective airlines, used only to identify them

## Privacy and terms

- [Privacy Policy](docs/privacy-policy.md)
- [Terms and Conditions](docs/terms.md)

Both are bundled into the app (Settings → About) so they're readable offline.

## Website

A one-page site with the privacy policy and terms lives in `docs/`, ready for GitHub Pages (Settings → Pages → Deploy from a branch → `main` / `/docs`). After editing `docs/privacy-policy.md` or `docs/terms.md`, run `npm run site` to regenerate `privacy.html` and `terms.html`.

## License

Ploop is licensed under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE) for third-party data and fonts, which keep their own licences.
