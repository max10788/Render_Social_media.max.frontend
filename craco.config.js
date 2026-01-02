module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Completely disable CSS minimization
      if (env === 'production') {
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
          plugin => plugin.constructor.name !== 'CssMinimizerPlugin'
        );
      }
      
      return webpackConfig;
    },
  },
};
