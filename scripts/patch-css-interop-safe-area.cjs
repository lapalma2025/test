/**
 * Guard NativeWind/css-interop against undefined JSX types (React 19 + Hermes crash).
 * Re-applied after npm install via postinstall.
 */
const fs = require('fs');
const path = require('path');

const interopRoot = path.join(__dirname, '..', 'node_modules', 'react-native-css-interop', 'dist', 'runtime');

const safeAreaFile = path.join(interopRoot, 'third-party-libs', 'react-native-safe-area-context.native.js');
const wrapJsxFile = path.join(interopRoot, 'wrap-jsx.js');
const apiFile = path.join(interopRoot, 'native', 'api.js');

function patchSafeArea() {
  if (!fs.existsSync(safeAreaFile)) return;
  let src = fs.readFileSync(safeAreaFile, 'utf8');
  const needle = 'function maybeHijackSafeAreaProvider(type) {\n    const name = type.displayName || type.name;';
  const replacement =
    'function maybeHijackSafeAreaProvider(type) {\n' +
    '    if (type == null || typeof type === "string" || typeof type === "number" || typeof type === "symbol")\n' +
    '        return type;\n' +
    '    const name = type.displayName || type.name;';
  if (src.includes(needle)) {
    src = src.replace(needle, replacement);
    fs.writeFileSync(safeAreaFile, src);
  }
}

function patchWrapJsx() {
  if (!fs.existsSync(wrapJsxFile)) return;
  let src = fs.readFileSync(wrapJsxFile, 'utf8');

  const earlyGuard =
    '        if (type == null) {\n' +
    '            console.error("[css-interop] undefined JSX element type");\n' +
    '            return null;\n' +
    '        }\n';

  if (!src.includes('undefined JSX element type')) {
    src = src.replace(
      '        if (type === "react-native-css-interop-jsx-pragma-check") {',
      earlyGuard + '        if (type === "react-native-css-interop-jsx-pragma-check") {'
    );
  }

  const needle =
    '        type = (0, react_native_safe_area_context_1.maybeHijackSafeAreaProvider)(type);';
  const replacement =
    '        if (type != null)\n' +
    '            type = (0, react_native_safe_area_context_1.maybeHijackSafeAreaProvider)(type);';
  if (src.includes(needle) && !src.includes('if (type != null)\n            type = (0, react_native_safe_area_context_1')) {
    src = src.replace(needle, replacement);
  }

  fs.writeFileSync(wrapJsxFile, src);
}

function patchApi() {
  if (!fs.existsSync(apiFile)) return;
  let src = fs.readFileSync(apiFile, 'utf8');
  const needle = 'const cssInterop = (baseComponent, mapping) => {\n    const configs = (0, config_1.getNormalizeConfig)(mapping);';
  const replacement =
    'const cssInterop = (baseComponent, mapping) => {\n' +
    '    if (baseComponent == null)\n' +
    '        return baseComponent;\n' +
    '    const configs = (0, config_1.getNormalizeConfig)(mapping);';
  if (src.includes(needle)) {
    src = src.replace(needle, replacement);
    fs.writeFileSync(apiFile, src);
  }
}

patchSafeArea();
patchWrapJsx();
patchApi();
console.log('[postinstall] css-interop safe-area patches applied');
