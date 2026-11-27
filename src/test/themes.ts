export function userThemeSource(name: string, bg = "#101010") {
  return {
    name,
    ui: { bg, panel: "#202020", accent: "#a0f0a0", accent2: "#f0a0f0", text: "#f0f0f0" },
    syntax: {
      keyword: "#f0a0f0",
      string: "#a0f0a0",
      function: "#f0d090",
      comment: "#909090",
      variable: "#c0c0f0",
    },
  };
}
