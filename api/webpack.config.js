/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const { lib } = require("serverless-webpack");

const isDev = lib.webpack.isLocal;

module.exports = {
  mode: isDev ? "development" : "production",
  target: "node",
  entry: "./main.ts",
  devtool: isDev ? "eval" : undefined,
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
  optimization: {
    minimize: !isDev,
    minimizer: [new TerserPlugin()],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    libraryTarget: "commonjs2",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js",
    sourceMapFilename: "[file].map",
  },
};
