const path = require("path");
const webpack = require("webpack");
const autoprefixer = require('autoprefixer');

module.exports = {
    watch: true,
    mode: 'development',
    entry: {
        login: "./src/webpack/login.js",
        login_style: "./src/webpack/login.scss",

        init: "./src/webpack/init.js",
        init_style: "./src/webpack/init.scss",

        index: "./src/webpack/index.js",
        index_style: "./src/webpack/index.scss",

        dashboard: "./src/webpack/dashboard/dashboard.js",
        dashboard_style: "./src/webpack/dashboard/dashboard.scss",

        addUser: "./src/webpack/user/addUser.js",
        addUser_style: "./src/webpack/user/addUser.scss",
        editUser: "./src/webpack/user/editUser.js",
        editUser_style: "./src/webpack/user/editUser.scss",

        viewUser: "./src/webpack/user/viewUser.js",
        viewUser_style: "./src/webpack/user/viewUser.scss",

        userEvents: "./src/webpack/user/userEvents.js",
        userEvents_style: "./src/webpack/user/userEvents.scss",

        userLogs: "./src/webpack/user/userLogs.js",
        userLogs_style: "./src/webpack/user/userLogs.scss",

        userlist: "./src/webpack/user/userlist.js",
        userlist_style: "./src/webpack/user/userlist.scss",

        addEvent: "./src/webpack/events/addEvent.js",
        addEvent_style: "./src/webpack/events/addEvent.scss",

        eventlist: "./src/webpack/events/eventlist.js",
        eventlist_style: "./src/webpack/events/eventlist.scss",

        event: "./src/webpack/events/event.js",
        event_style: "./src/webpack/events/event.scss",

        settings: "./src/webpack/settings/settings.js",

        editRole: "./src/webpack/roles/editRole.js",

        protocol: "./src/webpack/apps/protocol/protocol.js",
        protocol_style: "./src/webpack/apps/protocol/protocol.scss",

        protocolEditor: "./src/webpack/apps/protocol/protocol-editor.js",
        protocolEditor_style: "./src/webpack/apps/protocol/protocol-editor.scss",
    },
    output: {
        path: path.join(__dirname, "./src/dist"),
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