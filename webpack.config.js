/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");

module.exports = () => {
  return {
    mode: process.env.TARGET === "dev" ? "development" : "production",
    watch: process.env.TARGET === "dev",
    entry: {
      index: path.join(__dirname, "src", "index.ts"),
    },
    output: {
      path: path.join(__dirname, "build"),
      filename: "index.js",
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [{ loader: "ts-loader" }],
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    plugins: [
      new CopyPlugin({
        patterns: [{ from: "src/manifest.json", to: "manifest.json" }],
      }),
      ...(process.env.TARGET === "dev"
        ? []
        : [new ZipPlugin({ filename: "tell-me-the-title" })]),
    ],
  };
};
