const path = require("path");
const webpack = require("webpack");
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


module.exports = {
    entry: {
        login: "./webpack/login.js",
        login_style: "./webpack/login.scss",

        error: "./webpack/error.js",
        error_style: "./webpack/error.scss",

        init: "./webpack/init.js",
        init_style: "./webpack/init.scss",

        index: "./webpack/index.js",
        index_style: "./webpack/index.scss",

        dashboard: "./webpack/dashboard/dashboard.js",
        dashboard_style: "./webpack/dashboard/dashboard.scss",

        addUser: "./webpack/user/addUser.js",
        addUser_style: "./webpack/user/addUser.scss",
        editUser: "./webpack/user/editUser.js",
        editUser_style: "./webpack/user/editUser.scss",

        viewUser: "./webpack/user/viewUser.js",
        viewUser_style: "./webpack/user/viewUser.scss",

        userEvents: "./webpack/user/userEvents.js",
        userEvents_style: "./webpack/user/userEvents.scss",

        userLogs: "./webpack/user/userLogs.js",
        userLogs_style: "./webpack/user/userLogs.scss",

        userlist: "./webpack/user/userlist.js",
        userlist_style: "./webpack/user/userlist.scss",

        addEvent: "./webpack/events/addEvent.js",
        addEvent_style: "./webpack/events/addEvent.scss",

        eventlist: "./webpack/events/eventlist.js",
        eventlist_style: "./webpack/events/eventlist.scss",

        event: "./webpack/events/event.js",
        event_style: "./webpack/events/event.scss",

        system: "./webpack/system/system.js",

        settings: "./webpack/settings/settings.js",

        news: "./webpack/news/news.js",

        roles: "./webpack/roles/roles.js",

        protocol: "./webpack/apps/protocol/protocol.js",
        protocol_style: "./webpack/apps/protocol/protocol.scss",

        protocolEditor: "./webpack/apps/protocol/protocol-editor.js",
        protocolEditor_style: "./webpack/apps/protocol/protocol-editor.scss",

        user: "./webpack/userpage/user.js",
    },
    output: {
        path: path.join(__dirname, "./dist"),
        filename: "[name].js"
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        }),
        // new MiniCssExtractPlugin({
        //     // Options similar to the same options in webpackOptions.output
        //     // both options are optional
        //     filename: "[name].css",
        //     chunkFilename: "[id].css",
        // }),
    ],
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    { loader: 'style-loader' },
                    // Translates CSS into CommonJS
                    { loader: 'css-loader' },
                    // Compiles Sass to CSS
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

                ],
            },
            {
                test: /\.css$/,
                use: [
                    {loader: 'style-loader'},
                    {
                        loader: 'css-loader',
                    }
                ]
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
            },
            {
                test: /\.(jpg|png|svg|gif)$/,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        alias: {
            handlebars: 'handlebars/dist/handlebars.min.js'
        }
    }
};