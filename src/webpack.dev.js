const path = require("path");
const webpack = require("webpack");
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');


module.exports = merge(common, {
    watch: true,
    mode: 'development',
    devtool: 'eval-source-map'
});