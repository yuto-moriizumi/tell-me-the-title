/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
// const CompressionPlugin = require("compression-webpack-plugin");

module.exports = () => {
  return {
    mode: "production",
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
    // plugins: [new CompressionPlugin()],
  };
};
