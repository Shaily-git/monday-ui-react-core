const projectConfig = require("../webpack/storybook.config.js");

const mergeConfigRules = (originalConfig, newConfigRules) => {
  return {
    ...originalConfig,
    module: { ...originalConfig.module, rules: [...originalConfig.module.rules, ...newConfigRules] },
    resolve: { ...originalConfig.resolve, alias: { ...originalConfig.resolve.alias, ...projectConfig.resolve.alias } }
  };
};

const getProjectConfigRules = () => {
  return projectConfig.module.rules;
};

const getDocsConfigRules = () => {
  return [];
};

const buildConfig = config => {
  config = mergeConfigRules(config, getProjectConfigRules());
  config = mergeConfigRules(config, getDocsConfigRules());
  return config;
};

const getAddons = () => {
  const addons = [
    "@storybook/addon-controls",
    "storybook-addon-themes",
    "@storybook/addon-a11y",
    "storybook-addon-performance/register",
    "@storybook/addon-docs",
    "@storybook/addon-toolbars",
    "@storybook/addon-actions",
    "storybook-addon-designs"
  ];

  if (process.env.NODE_ENV !== "production") {
    addons.push("@storybook/addon-interactions");
  }

  return addons;
};

module.exports = {
  stories: ["../src/**/*.stories.mdx"],
  webpackFinal: async config => {
    return buildConfig(config);
  },
  features: {
    interactionsDebugger: true
  },
  addons: getAddons(),
  core: {
    builder: "webpack5"
  }
};
