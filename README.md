# Ploop

_Every flight as a little story._

Ploop is an offline flight log for Android. Scan a boarding pass (or type a flight in) and Ploop turns your trips into a passport: stats, country stamps, a route map and shareable story images.

- **Private by design.** No accounts, no servers, no analytics. Release builds don't even have the internet permission. Your flights stay on your phone.
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

```bash
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
```

## Project structure

```
app/              Screens (Expo Router)
src/components/   UI components
src/lib/          Core logic: boarding-pass parser, stats, dates, backups (unit tested)
src/db/           SQLite schema, migrations and queries (Drizzle)
src/stories/      Story image templates and export
src/theme/        Colours, fonts and spacing
plugins/          Expo config plugin that strips the internet permission from release builds
scripts/          Build-time data scripts
assets/           Fonts, images, airline logos and bundled reference data
```

## Credits

- **Airports:** [OurAirports](https://ourairports.com/data/) (public domain)
- **Airlines:** [OpenFlights](https://openflights.org/data.html) (Open Database License)
- **Map outlines:** Natural Earth via [world-atlas](https://github.com/topojson/world-atlas) (public domain)
- **Fonts:** Plus Jakarta Sans, Inter and Fredoka (SIL Open Font License, see `assets/fonts/`)
- **Icons:** Feather (MIT)
- **Airline logos:** trademarks of their respective airlines, used only to identify them

## License

Ploop is licensed under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE) for third-party data and fonts, which keep their own licences.
