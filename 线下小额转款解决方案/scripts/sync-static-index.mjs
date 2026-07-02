import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const builtHtmlPath = 'dist/build.html';
const distIndexPath = 'dist/index.html';
const rootIndexPath = 'index.html';

const builtHtml = readFileSync(builtHtmlPath, 'utf8');
copyFileSync(builtHtmlPath, distIndexPath);
writeFileSync(
  rootIndexPath,
  builtHtml
    .replaceAll('./assets/', './dist/assets/')
    .replace(
      '    <script type="module"',
      '    <script>window.__PUBLIC_ASSET_BASE__ = "./dist/";</script>\n    <script type="module"'
    )
);
