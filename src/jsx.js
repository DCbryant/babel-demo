const babel = require("@babel/core");
const pluginTransformReactJsx = require('./plugin-transform-react-jsx');
// const pluginTransformReactJsx = require('./old_jsx_plugin');
const sourceCode = `<h1 id="1" key="2" ref="3">hello</h1>`;
const result = babel.transform(sourceCode, {
    plugins: [
        [pluginTransformReactJsx, {runtime: 'automatic'}]
    ]
});

console.log(result.code);