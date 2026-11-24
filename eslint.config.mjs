import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // `set-state-in-effect` flags the fetch-on-mount + reset-on-prop-change
      // pattern used by every workspace hook. Those effects are intentional
      // (load data once, then poll); converting them to `useSyncExternalStore`
      // would be a large rewrite for no behavioural gain. Keep it visible as a
      // warning so new occurrences are reviewed, without failing the build.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
