const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find CSS Minimizer Plugin
      const minimizerPlugins = webpackConfig.optimization.minimizer;
      
      // Update CSS Minimizer options
      const cssMinimizerIndex = minimizerPlugins.findIndex(
        plugin => plugin.constructor.name === 'CssMinimizerPlugin'
      );
      
      if (cssMinimizerIndex !== -1) {
        minimizerPlugins[cssMinimizerIndex] = new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                // More lenient CSS parsing
                discardComments: { removeAll: true },
                normalizeUnicode: false,
              },
            ],
          },
        });
      }
      
      return webpackConfig;
    },
  },
};
