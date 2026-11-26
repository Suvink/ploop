/**
 * Ploop is fully offline. This plugin removes android.permission.INTERNET (plus
 * ACCESS_NETWORK_STATE and SYSTEM_ALERT_WINDOW, which only the dev client needs) from the
 * merged manifest of RELEASE builds, while keeping it for DEBUG builds (the dev client
 * needs the network to reach Metro).
 *
 * How it works:
 *  - main/AndroidManifest.xml gets <uses-permission android:name="android.permission.INTERNET" tools:node="remove"/>
 *    which strips the permission contributed by React Native and any library.
 *  - debug/AndroidManifest.xml (higher merge priority, debug builds only) re-declares it with
 *    tools:node="replace", which overrides the main "remove" marker.
 *
 * Verify a release build with:
 *   aapt2 dump permissions android/app/build/outputs/apk/release/app-release.apk
 */
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Debug-only permissions: needed by the dev client (Metro, dev menu overlay), never in release.
const DEBUG_ONLY = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.SYSTEM_ALERT_WINDOW',
];

function withRemoveFromMain(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const perms = (manifest['uses-permission'] = manifest['uses-permission'] || []);
    const filtered = perms.filter((p) => !DEBUG_ONLY.includes(p.$['android:name']));
    for (const name of DEBUG_ONLY)
      filtered.push({ $: { 'android:name': name, 'tools:node': 'remove' } });
    manifest['uses-permission'] = filtered;
    return cfg;
  });
}

function withKeepInDebug(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const file = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'debug',
        'AndroidManifest.xml',
      );
      if (!fs.existsSync(file)) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(
          file,
          '<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">\n</manifest>\n',
        );
      }
      let xml = fs.readFileSync(file, 'utf8');
      if (!xml.includes('xmlns:tools')) {
        xml = xml.replace(
          '<manifest ',
          '<manifest xmlns:tools="http://schemas.android.com/tools" ',
        );
      }
      for (const name of DEBUG_ONLY) {
        // Drop any existing declaration, then re-add it with tools:node="replace".
        xml = xml.replace(
          new RegExp(`\\s*<uses-permission[^>]*android:name="${name}"[^>]*/>`, 'g'),
          '',
        );
        xml = xml.replace(
          /<manifest([^>]*)>/,
          `<manifest$1>\n    <uses-permission android:name="${name}" tools:node="replace"/>`,
        );
      }
      fs.writeFileSync(file, xml);
      return cfg;
    },
  ]);
}

module.exports = function withNoInternetInRelease(config) {
  return withKeepInDebug(withRemoveFromMain(config));
};
