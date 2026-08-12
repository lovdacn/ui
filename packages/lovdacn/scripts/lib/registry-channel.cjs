/**
 * registry-channel — single source of truth for WHERE generated registry output goes.
 *
 * The channel is derived from the package version, so one fact drives both halves of the
 * release: a prerelease version publishes to the npm `beta` tag AND writes its registry
 * output under `r/beta`, while a stable version uses `r`.
 *
 *   1.0.0-beta.7  ->  channel "beta"    ->  apps/v2/public/r/beta
 *   0.1.4         ->  channel "stable"  ->  apps/v2/public/r
 *
 * This is what mechanically enforces the frozen stable baseline: while the package is on a
 * prerelease line, no generator can write into `r/` by accident, because none of them knows
 * that path any more. Publishing a stable release is the deliberate act of dropping the
 * prerelease suffix.
 *
 * `LOVDA_REGISTRY_CHANNEL=stable|beta` overrides the derivation for one-off builds.
 *
 * The CLI applies the SAME rule at runtime (see src/utils/registry-url.ts), so a beta CLI
 * downloads from the same place the beta build wrote to.
 */

const fs = require('fs-extra');
const path = require('path');

/** Repository root (…/lvcn). This file lives at packages/lovdacn/scripts/lib. */
const LVCN_ROOT = path.resolve(__dirname, '../../../..');
const PACKAGE_JSON = path.join(__dirname, '../../package.json');

const STABLE_RELATIVE = 'apps/v2/public/r';
const BETA_RELATIVE = 'apps/v2/public/r/beta';

/** True for any `-beta.*` prerelease version. */
function isBetaVersion(version) {
  return typeof version === 'string' && version.includes('-beta.');
}

function packageVersion() {
  return fs.readJsonSync(PACKAGE_JSON).version;
}

/**
 * Resolve the active channel: explicit env override first, otherwise derived from the
 * package version.
 */
function resolveChannel() {
  const override = process.env.LOVDA_REGISTRY_CHANNEL;
  if (override) {
    const normalized = override.trim().toLowerCase();
    if (normalized !== 'stable' && normalized !== 'beta') {
      throw new Error(
        `LOVDA_REGISTRY_CHANNEL must be "stable" or "beta" (received "${override}").`
      );
    }
    return normalized;
  }
  return isBetaVersion(packageVersion()) ? 'beta' : 'stable';
}

/** Registry root relative to the repository root, e.g. `apps/v2/public/r/beta`. */
function registryRelativeRoot() {
  return resolveChannel() === 'beta' ? BETA_RELATIVE : STABLE_RELATIVE;
}

/** Absolute registry root for the active channel. */
function registryRoot() {
  return path.join(LVCN_ROOT, registryRelativeRoot());
}

/** Join a path under the active channel's registry root, relative to the repository root. */
function registryRelative(...segments) {
  return [registryRelativeRoot(), ...segments].join('/');
}

/** One-line summary for build logs. */
function describe() {
  const channel = resolveChannel();
  const source = process.env.LOVDA_REGISTRY_CHANNEL ? 'LOVDA_REGISTRY_CHANNEL' : 'package version';
  return `channel: ${channel} (from ${source}) -> ${registryRelativeRoot()}`;
}

module.exports = {
  LVCN_ROOT,
  STABLE_RELATIVE,
  BETA_RELATIVE,
  isBetaVersion,
  packageVersion,
  resolveChannel,
  registryRelativeRoot,
  registryRoot,
  registryRelative,
  describe,
};
