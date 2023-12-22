import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import type { Configuration } from "webpack";
import { lib } from "serverless-webpack";

const isDev = lib.webpack.isLocal;

const config: Configuration = {
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

export default config;
