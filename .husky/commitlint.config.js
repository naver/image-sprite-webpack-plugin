module.exports = {
  extends: ["@commitlint/config-conventional"],

  // https://github.com/conventional-changelog/commitlint/blob/master/docs/reference-rules.md
  rules: {
    "subject-case": [0],
    "type-enum": [
      2,
      "always",
      [
        "docs",
        "env",
        "enhance",
        "feat",
        "fix",
        "refactor",
        "revert",
        "skip",
        "style",
        "test",
      ],
    ],
  },
};
