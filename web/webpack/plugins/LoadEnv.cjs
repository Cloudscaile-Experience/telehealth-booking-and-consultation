const webpack = require('webpack');

class LoadEnv {
  constructor(envVars = []) {
    this.envVars = envVars;
    this.pluginName = 'LoadEnv';
  }

  apply(compiler) {
    const definePluginConfig = {};

    // Build the configuration object for DefinePlugin
    for (const envVar of this.envVars) {
      if (process.env[envVar] !== undefined) {
        definePluginConfig[`process.env.${envVar}`] = JSON.stringify(process.env[envVar]);
      }
    }

    // Apply DefinePlugin with the collected env vars
    const definePlugin = new webpack.DefinePlugin(definePluginConfig);
    definePlugin.apply(compiler);
  }
}

module.exports = LoadEnv;
