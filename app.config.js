/**
 * The app version comes from package.json (bump it with `npm version patch|minor|major`).
 * Android's versionCode is derived from it: 1.2.3 → 10203.
 */
const pkg = require('./package.json');

function versionCode(v) {
  const [major = 0, minor = 0, patch = 0] = v.split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  return major * 10000 + minor * 100 + patch;
}

module.exports = ({ config }) => ({
  ...config,
  version: pkg.version,
  android: { ...config.android, versionCode: versionCode(pkg.version) },
});
