/**
 * Expo config plugin: SwiftUICore auto-link fix.
 *
 * Why this exists
 * ───────────────
 * Xcode 16+ (iOS 26 SDK) auto-links SwiftUICore — a private Apple
 * framework — into every target that uses SwiftUI. CocoaPods writes
 * `-framework "SwiftUICore"` into the xcconfig of each Pods-* aggregate
 * target. SwiftUICore refuses to link into anything that isn't a real
 * `.app` bundle, so the build fails with:
 *
 *   ld: Could not find or use auto-linked framework
 *       'SwiftUICore.framework': cannot link directly with 'SwiftUICore'
 *       because product being built is not an app
 *       (in target 'Pods-joypershub' from project 'Pods')
 *
 * The actual app target should link SwiftUICore — only the aggregate is
 * the problem. This plugin injects a `post_install` hook into the
 * Podfile that strips `-framework "SwiftUICore"` from every Pods-*
 * aggregate xcconfig after CocoaPods writes them. The app target is
 * untouched.
 *
 * Why a plugin (not a manual Podfile edit)
 * ────────────────────────────────────────
 * `ios/` is gitignored because Expo treats it as ephemeral — regenerated
 * by `npx expo prebuild`. A manual Podfile edit would survive the next
 * `pod install` but be silently wiped by the next prebuild. This plugin
 * runs during prebuild and re-applies the patch every time, so the fix
 * is durable across rebuilds, clean checkouts, and CI.
 *
 * When this plugin can be removed
 * ───────────────────────────────
 * When upstream Expo / React Native / CocoaPods ships a fix for the
 * SwiftUICore auto-link issue. Track:
 *   - https://github.com/CocoaPods/CocoaPods/issues
 *   - https://github.com/expo/expo/issues
 * Until then, this plugin pays for itself on every build.
 */

const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const HOOK_MARKER = "# ── SwiftUICore auto-link fix (config plugin) ──";

const HOOK_SNIPPET = `
    ${HOOK_MARKER}
    # Strip SwiftUICore from every Pods-* aggregate xcconfig. See
    # plugins/with-swiftui-core-fix.js for full rationale.
    installer.aggregate_targets.each do |aggregate_target|
      aggregate_target.user_build_configurations.each do |config_name, _|
        xcconfig_path = aggregate_target.xcconfig_path(config_name)
        next unless File.exist?(xcconfig_path)
        original = File.read(xcconfig_path)
        patched = original.gsub(/-framework\\s+"SwiftUICore"\\s*/, '')
        File.write(xcconfig_path, patched) if patched != original
      end
    end
`;

/**
 * Inject the fix into an existing Podfile. Idempotent — re-running on a
 * Podfile that already contains the marker is a no-op.
 */
function patchPodfile(podfile) {
  if (podfile.includes(HOOK_MARKER)) {
    return podfile; // already patched
  }

  // Inject inside the existing `post_install do |installer|` block,
  // immediately after `react_native_post_install(...)`. We anchor on
  // the closing `)` of that call followed by a newline.
  const anchor = /react_native_post_install\([\s\S]*?\)\n/;
  if (!anchor.test(podfile)) {
    // Defensive: if Expo ever changes the default Podfile shape, fail
    // loudly during prebuild rather than silently producing a broken build.
    throw new Error(
      "[with-swiftui-core-fix] Could not locate `react_native_post_install(...)` " +
        "in Podfile to anchor the SwiftUICore patch. The default Expo Podfile may " +
        "have changed shape — update plugins/with-swiftui-core-fix.js."
    );
  }

  return podfile.replace(anchor, (match) => match + HOOK_SNIPPET);
}

const withSwiftUICoreFix = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile"
      );
      if (!fs.existsSync(podfilePath)) {
        throw new Error(
          `[with-swiftui-core-fix] Podfile not found at ${podfilePath}`
        );
      }
      const original = fs.readFileSync(podfilePath, "utf8");
      const patched = patchPodfile(original);
      if (patched !== original) {
        fs.writeFileSync(podfilePath, patched);
      }
      return cfg;
    },
  ]);
};

module.exports = withSwiftUICoreFix;
// Exported for unit testing.
module.exports.patchPodfile = patchPodfile;
module.exports.HOOK_MARKER = HOOK_MARKER;
