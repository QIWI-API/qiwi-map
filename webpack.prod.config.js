const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: ['whatwg-fetch', './src/App.js'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[hash].js'
    },
    module: {
        rules: [
            {
                test: /.js?$/,
                use: ['babel-loader', 'eslint-loader'],
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|svg|jpg|gif|woff|woff2)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8000
                        }
                    }
                ]
            },
            {
                test: /\.(eot|ttf|otf)$/,
                use: ['file-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.json']
    },
    optimization: {
        namedModules: true, // NamedModulesPlugin()
        splitChunks: {
            // CommonsChunkPlugin()
            /* chunks: 'all',
            name: false */
            minChunks: 2
        },
        noEmitOnErrors: true, // NoEmitOnErrorsPlugin
        concatenateModules: true, //ModuleConcatenationPlugin
        minimizer: [new TerserPlugin({
            parallel: true
        })]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new HtmlWebpackPlugin({
            template: './public/index.html',
            inject: 'body',
            minify: {
                minifyCSS: true,
                minifyJS: true,
                removeComments: true,
                collapseWhitespace: true
            }
        })
    ]
};
