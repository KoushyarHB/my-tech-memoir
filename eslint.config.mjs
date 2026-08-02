import next from "eslint-config-next";

const eslintConfig = [
  ...next,
  {
    ignores: ["**/generated/**", "**/.next/**", "**/node_modules/**"],
  },
];

export default eslintConfig;
