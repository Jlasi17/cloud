module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Remove the ModuleScopePlugin which throws when we try to import something outside of src/
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
      );

      // Handle source map loader issues
      webpackConfig.module.rules = webpackConfig.module.rules.map((rule) => {
        if (rule.oneOf) {
          rule.oneOf = rule.oneOf.map((oneOfRule) => {
            if (
              oneOfRule.loader &&
              oneOfRule.loader.includes('source-map-loader')
            ) {
              // Exclude Emotion and other problematic packages from source-map-loader
              oneOfRule.exclude = [
                /@emotion/,
                /node_modules[\\/]@mui[\\/]material[\\/]/,
                /node_modules[\\/]@mui[\\/]icons-material[\\/]/,
                /node_modules[\\/]@mui[\\/]x-date-pickers[\\/]/,
              ];
            }
            return oneOfRule;
          });
        }
        return rule;
      });

      return webpackConfig;
    },
  },
};
