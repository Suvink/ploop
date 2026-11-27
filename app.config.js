/**
 * The app version comes from package.json (bump it with `npm version patch|minor|major`).
 * Android's versionCode is derived from it: 1.2.3 → 10203.
 */
const pkg = require('./package.json');

function versionCode(v) {
  const [major = 0, minor = 0, patch = 0] = v.split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  return major * 10000 + minor * 100 + patch;
}

/**
 * AdMob app ID: app.json holds Google's test ID; release builds set ADMOB_ANDROID_APP_ID
 * (an EAS environment variable) to the real one.
 */
function withAdMobAppId(plugins) {
  const appId = process.env.ADMOB_ANDROID_APP_ID;
  if (!appId) return plugins;
  return plugins.map((p) =>
    Array.isArray(p) && p[0] === 'react-native-google-mobile-ads'
      ? [p[0], { ...p[1], androidAppId: appId }]
      : p,
  );
}

module.exports = ({ config }) => ({
  ...config,
  version: pkg.version,
  android: { ...config.android, versionCode: versionCode(pkg.version) },
  plugins: withAdMobAppId(config.plugins ?? []),
});
