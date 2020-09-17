const path = require("path");
const autoprefixer = require('autoprefixer');

module.exports = {
    entry: {
        login: "./src/webpack/login.js",
        login_style: "./src/webpack/login.scss",
        addUser: "./src/webpack/addUser.js",
        addUser_style: "./src/webpack/addUser.scss",
        addEvent: "./src/webpack/addEvent.js",
        addEvent_style: "./src/webpack/addEvent.scss"
    },
    output: {
        path: path.join(__dirname, "./src/dist"),
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].css',
                        },
                    },
                    { loader: 'extract-loader' },
                    { loader: 'css-loader' },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: () => [autoprefixer()]
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            // Prefer Dart Sass
                            implementation: require('sass'),

                            // See https://github.com/webpack-contrib/sass-loader/issues/804
                            webpackImporter: false,
                            sassOptions: {
                                includePaths: ['./node_modules']
                            },
                        }
                    },
                ]
            }
        ]
    },
};