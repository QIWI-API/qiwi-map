const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
    devtool: 'eval-source-map',
    entry: ['babel-polyfill','whatwg-fetch','url-search-params','./src/main.js'],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [{
            test: /.js?$/,
            use: [
                'babel-loader'
            ],
            exclude: /node_modules/
        },{
            test: /\.css$/,
            use: [
                'style-loader',
                'css-loader'
            ]
        }, {
            test: /\.(png|svg|jpg|gif|woff|woff2)$/,
            use: [{
                loader: 'url-loader',
                options: {
                    limit: 100000
                }
            }]
        }, {
            test: /\.(eot|ttf|otf)$/,
            use: [
                'file-loader'
            ]
        },{
            test: /\.json$/,
            loader: 'json-loader'
        }]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('development')
            }
        }),
        new webpack.NamedModulesPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            inject: 'body',
        })
    ],
    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        hot: true,
        port: 9180,
        publicPath: '/'
    }
};