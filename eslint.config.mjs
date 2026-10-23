import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["front/build", ".prettierrc.js"],
  },
  {
    files: ["**/webpack.config.js", "**/jsdom-stylesheet-loader.js", ".github/scripts/*.mjs"],
    languageOptions: { globals: globals.node },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
);
