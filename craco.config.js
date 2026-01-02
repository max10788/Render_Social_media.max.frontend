const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find and update CSS Minimizer Plugin
      const minimizerPlugins = webpackConfig.optimization.minimizer;
      
      const cssMinimizerIndex = minimizerPlugins.findIndex(
        plugin => plugin.constructor.name === 'CssMinimizerPlugin'
      );
      
      if (cssMinimizerIndex !== -1) {
        minimizerPlugins[cssMinimizerIndex] = new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                normalizeUnicode: false,
                // Disable calc optimization to prevent division errors
                calc: false,
                // Disable svgo to prevent path errors
                svgo: false,
              },
            ],
          },
        });
      }
      
      return webpackConfig;
    },
  },
  style: {
    postcss: {
      mode: 'file',
    },
  },
};
