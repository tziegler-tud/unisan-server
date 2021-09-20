const path = require("path");
const autoprefixer = require('autoprefixer');

module.exports = {
    watch: true,
    mode: 'development',
    entry: {
        login: "./src/webpack/login.js",
        login_style: "./src/webpack/login.scss",
        addUser: "./src/webpack/addUser.js",
        addUser_style: "./src/webpack/addUser.scss",
        addEvent: "./src/webpack/addEvent.js",
        addEvent_style: "./src/webpack/addEvent.scss",
        drawer: "./src/webpack/drawer.js",
        drawer_style: "./src/webpack/drawer.scss",

        editEvent: "./src/webpack/events/editEvent.js",
        editEvent_style: "./src/webpack/events/editEvent.scss",
        viewEvent: "./src/webpack/events/viewEvent.js",
        viewEvent_style: "./src/webpack/events/viewEvent.scss",

        editUser: "./src/webpack/user/editUser.js",
        editUser_style: "./src/webpack/user/editUser.scss",

        protocol: "./src/webpack/apps/protocol/protocol.js",
        protocol_style: "./src/webpack/apps/protocol/protocol.scss",
        app_navigation: "./src/webpack/apps/app_navigation.js",
        app_navigation_style: "./src/webpack/apps/app_navigation.scss",
        app_drawer: "./src/webpack/apps/app_drawer.js",
        app_drawer_style: "./src/webpack/apps/app_drawer.scss",
        app_topbar: "./src/webpack/apps/app_topbar.js",
        app_topbar_style: "./src/webpack/apps/app_topbar.scss"
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
                            postcssOptions: {
                                plugins: [
                                    autoprefixer()
                                ]
                            }
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
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/'
                        }
                    }
                ]
            }
        ]
    },
};