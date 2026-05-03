// Single source of truth for the CSS variable palette. Mirrors mobile/global.css
// but lives in TS so we can inject it via NativeWind's `vars()` helper at the
// app root — which is more reliable than the `:root` / `.dark` selectors when
// it comes to CSS variable scoping in React Native.

export const LIGHT_VARS = {
  '--bg': '250 250 249',
  '--fg': '28 25 23',
  '--card': '255 255 255',
  '--border': '231 229 228',
  '--muted': '245 245 244',
  '--muted-fg': '120 113 108',
  '--brand': '14 165 233',
  '--accent': '245 245 244',
};

export const DARK_VARS = {
  '--bg': '12 10 9',
  '--fg': '250 250 249',
  '--card': '28 25 23',
  '--border': '41 37 36',
  '--muted': '28 25 23',
  '--muted-fg': '168 162 158',
  '--brand': '14 165 233',
  '--accent': '41 37 36',
};

export const paletteFor = (resolved: 'light' | 'dark') =>
  resolved === 'dark' ? DARK_VARS : LIGHT_VARS;
