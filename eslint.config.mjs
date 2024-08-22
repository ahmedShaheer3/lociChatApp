import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
      "no-confusing-arrow": "error",
      "no-constructor-return": "error",
      "no-empty-function": "error",
      "no-inline-comments": "error",
      "no-lonely-if": "error",
      "no-duplicate-imports": "error",
      "comma-dangle": 0,
      "multiline-ternary": 0,
      "no-global-assign": 0,
      "react-native/no-raw-text": 0,
      "react/no-unescaped-entities": 0,
      "react/prop-types": 0,
      "space-before-function-paren": 0,
    },
  },
  eslintConfigPrettier,
  {
    ignores: [".config/*", "**/node_modules/", ".git/"],
  },
];
