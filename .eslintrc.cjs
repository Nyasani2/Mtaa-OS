module.exports = {
  root: true,
  extends: ["expo", "plugin:import/recommended"],
  plugins: ["import"],
  settings: {
    "import/resolver": {
      typescript: {}
    }
  },
  rules: {
    "import/no-unresolved": "error",

    // 🚫 MTAA IMPORT LOCK (no hooks direct access)
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          "@/hooks/*",
          "../../hooks/*",
          "../../../hooks/*"
        ]
      }
    ]
  }
};
