const glob = require('glob');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { EnvironmentPlugin } = require('webpack');

const entries = glob.sync(path.join(__dirname, '/src/**/*-entry.ts'));

const config = (entry) => {
  const name = path.basename(entry, '.ts').replace('-entry', '');
  return {
    entry,
    mode: 'development',
    devtool: 'source-map',
    devServer: {
      liveReload: false,
      disableHostCheck: true,
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: `${name}.js`,
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    },
    optimization: {
      minimize: false,
    },
    performance: {
      hints: false,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.(ts|js)$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
        // this is unlimited b/c i'm lazy
        // will see how this scales
        {
          test: /\.(png|jpg|gif)$/i,
          use: [
            {
              loader: 'url-loader',
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: `${name}.html`,
        template: path.join(__dirname, `/src/${name}.html`),
        inject: true,
      }),
      new EnvironmentPlugin({
        PEERJS_HOST: 'localhost',
        PEERJS_PORT: 9000,
      }),
    ],
  };
};

module.exports = entries.map(config);
