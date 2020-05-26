const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const project = require('./aurelia_project/aurelia.json');
const { AureliaPlugin, ModuleDependenciesPlugin } = require('aurelia-webpack-plugin');
const { ProvidePlugin } = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlCriticalPlugin = require('html-critical-webpack-plugin');

const ensureArray = config => (config && (Array.isArray(config) ? config : [config])) || [];
const when = (condition, config, negativeConfig) => (condition ? ensureArray(config) : ensureArray(negativeConfig));

const title = 'Tribaldex - Smart Contracts on the HIVE blockchain';
const outDir = path.resolve(__dirname, project.platform.output);
const srcDir = path.resolve(__dirname, 'src');
const baseUrl = '/';

const loaders = {
    style: { loader: 'style-loader' },
    css: { loader: 'css-loader' },
    cssModules: {
        loader: 'css-loader',
        options: {
            importLoaders: 2,
            modules: {
                localIdentName: '[name]__[local]____[hash:base64:5]',
            },
        },
    },
    postCss: { loader: 'postcss-loader' },
};

const productionCss = [{
        loader: MiniCssExtractPlugin.loader,
    },
    loaders.cssModules,
    loaders.postCss,
];

const productionGlobalCss = [{
        loader: MiniCssExtractPlugin.loader,
    },
    loaders.css,
    loaders.postCss,
];

module.exports = ({ production, server, extractCss, coverage, analyze, karma } = {}) => ({
    resolve: {
        extensions: ['.ts', '.js'],
        modules: [srcDir, 'node_modules'],
        alias: {
            'base-environment': path.resolve(__dirname, 'aurelia_project/environments/base'),
            inherits: path.resolve(__dirname, 'node_modules/inherits'),
            'safe-buffer': path.resolve(__dirname, 'node_modules/safe-buffer'),
        },
    },
    entry: {
        app: ['aurelia-bootstrapper'],
    },
    mode: production ? 'production' : 'development',
    stats: 'errors-only',
    output: {
        path: outDir,
        publicPath: baseUrl,
        filename: production ? '[name].[contenthash].bundle.js' : '[name].[hash].bundle.js',
        sourceMapFilename: production ? '[name].[contenthash].bundle.map' : '[name].[hash].bundle.map',
        chunkFilename: production ? '[name].[contenthash].chunk.js' : '[name].[hash].chunk.js',
    },
    performance: { hints: false },
    devServer: {
        contentBase: outDir,
        historyApiFallback: true,
        http2: true,
        stats: 'errors-only'
    },
    devtool: production ? 'source-maps' : 'inline-source-map',
    module: {
        rules: [{
                test: /\.module.css$/,
                issuer: [{ not: [{ test: /\.html$/i }] }],
                use: production ? productionCss : [loaders.style, loaders.cssModules, loaders.postCss],
            },
            {
                test: /^((?!\.module).)*css$/,
                issuer: [{ not: [{ test: /\.html$/i }] }],
                use: production ? productionGlobalCss : [loaders.style, loaders.css, loaders.postCss],
            },
            {
                test: /\.css$/i,
                issuer: [{ test: /\.html$/i }],
                use: [loaders.css, loaders.postCss],
            },
            { test: /\.html$/i, loader: 'html-loader' },
            { test: /\.ts$/, loader: 'ts-loader' },
            {
                test: /\.(png|gif|jpg|cur)$/i,
                loader: 'url-loader',
                options: { limit: 8192, esModule: false },
            },
            {
                test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
                loader: 'url-loader',
                options: { limit: 10000, mimetype: 'application/font-woff2', esModule: false },
            },
            {
                test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
                loader: 'url-loader',
                options: { limit: 10000, mimetype: 'application/font-woff', esModule: false },
            },
            {
                test: /\.(ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
                loader: 'file-loader',
                options: {
                    esModule: false,
                },
            },
            ...when(coverage, {
                test: /\.[jt]s$/i,
                loader: 'istanbul-instrumenter-loader',
                include: srcDir,
                exclude: [/\.(spec|test)\.[jt]s$/i],
                enforce: 'post',
                options: { esModules: true },
            }),
        ],
    },
    plugins: [
        ...when(!karma, new DuplicatePackageCheckerPlugin()),
        new AureliaPlugin({
            features: {
                ie: false,
                svg: false,
            },
        }),
        new ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
        }),
        new ModuleDependenciesPlugin({
            'aurelia-testing': ['./compile-spy', './view-spy'],
        }),
        new HtmlWebpackPlugin({
            template: 'index.ejs',
            metadata: {
                title,
                server,
                baseUrl,
            },
        }),
        ...when(
            production,
            new HtmlCriticalPlugin({
                base: path.join(path.resolve(__dirname), 'dist/'),
                src: 'index.html',
                dest: 'index.html',
                inline: true,
                minify: true,
                extract: true,
                width: 1920,
                height: 1080,
                penthouse: {
                    blockJSRequests: false,
                },
            }),
        ),
        ...when(
            extractCss,
            new MiniCssExtractPlugin({
                filename: production ? 'css/[name].[contenthash].bundle.css' : 'css/[name].[hash].bundle.css',
                chunkFilename: production ? 'css/[name].[contenthash].chunk.css' : 'css/[name].[hash].chunk.css',
            }),
        ),
        ...when(production || server, new CopyWebpackPlugin([{ from: 'static', to: outDir, ignore: ['.*'] }])),
        new CopyWebpackPlugin([{ from: 'src/locales/', to: 'locales/' }]),
        ...when(analyze, new BundleAnalyzerPlugin()),
    ],
});