module.exports = {
    presets: [
        [
            '@babel/env',
            {
                targets: {
                    browsers: ['last 3 versions'],
                },
                useBuiltIns: 'usage',
                modules: false,
            },
        ],
    ],
    plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-class-properties'
    ],
};
