/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

// jsdom reads its default stylesheet from disk at module load time. Once jsdom is
// bundled for Lambda that file is no longer next to the bundle, so inline the
// stylesheet into the bundle at build time instead.
module.exports = function jsdomStylesheetLoader(source) {
  const jsdomEntry = require.resolve("jsdom");
  const stylesheetPath = path.resolve(
    path.dirname(jsdomEntry),
    "jsdom/browser/default-stylesheet.css",
  );
  const stylesheet = fs.readFileSync(stylesheetPath, "utf-8");

  const patched = source.replace(
    /const defaultStyleSheet = fs\.readFileSync\([\s\S]*?\n\);/,
    `const defaultStyleSheet = ${JSON.stringify(stylesheet)};`,
  );

  if (patched === source) {
    throw new Error("Failed to inline the jsdom default stylesheet");
  }

  return patched;
};
