/** @jest-environment node */
const { patchPodfile, HOOK_MARKER } = require("../with-swiftui-core-fix");

const SAMPLE_PODFILE = `
target 'joypershub' do
  use_expo_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true,
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
    )
  end
end
`;

describe("with-swiftui-core-fix patchPodfile", () => {
  test("injects the hook after react_native_post_install", () => {
    const out = patchPodfile(SAMPLE_PODFILE);
    expect(out).toContain(HOOK_MARKER);
    expect(out).toMatch(/react_native_post_install\([\s\S]*?\)\n\s*# ── SwiftUICore/);
    expect(out).toContain('-framework\\s+"SwiftUICore"\\s*');
  });

  test("is idempotent — second call is a no-op", () => {
    const once = patchPodfile(SAMPLE_PODFILE);
    const twice = patchPodfile(once);
    expect(twice).toBe(once);
  });

  test("preserves the original react_native_post_install call", () => {
    const out = patchPodfile(SAMPLE_PODFILE);
    expect(out).toContain("react_native_post_install(");
    expect(out).toContain(":mac_catalyst_enabled => false");
  });

  test("throws a clear error if the anchor is missing", () => {
    const broken = "target 'foo' do\n  # no react_native_post_install here\nend\n";
    expect(() => patchPodfile(broken)).toThrow(/Could not locate.*react_native_post_install/);
  });
});
