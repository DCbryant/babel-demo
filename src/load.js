const babel = require("@babel/core");
const pluginTransformReactJsx = require('./plugin-transform-react-jsx');
// const pluginTransformReactJsx = require('./old_jsx_plugin');
const sourceCode = `
  import React from 'react';
  import ReactDOM from 'react-dom';
  import { Input, Button } from 'antd'


  ReactDOM.render(
    <>
      <div>
        <Input placeholder="Basic usage" />
        <Button >ADD</Button>
      </div>
    </>,
    document.getElementById('root')
  )
`;
const result = babel.transform(sourceCode, {
    plugins: [
        [pluginTransformReactJsx, {runtime: 'automatic'}]
    ]
});

console.log(result.code);