const parser = require('@babel/parser');
// es module 导出
const  babel = require("@babel/core");
const {transformFromAst} = babel;

const insertParametersPlugin = require('./console');

const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`;

const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous',
    plugins: ['jsx']
});

const { code } = transformFromAst(ast, sourceCode, {
    plugins: [insertParametersPlugin]
});

console.log(code);