const { declare } = require('@babel/helper-plugin-utils');
const importModule = require('@babel/helper-module-imports');

const doctrine = require('doctrine');
const { useEffect } = require('react');

function parseComment(commentStr) {
    if (!commentStr) {
        return;
    }
    return doctrine.parse(commentStr, {
        unwrap: true
    });
}

const autoTrackPlugin = declare((api, options, dirname) => {
    // 断言babel7 
    api.assertVersion(7);

    return {
        visitor: {
            Program: {
                enter (path, state) {
                  // 遍历判断是否引入过模块，引入过就停止，否则就引入
                    path.traverse({
                        ImportDeclaration (path , state) {
                            // 引入路径 
                            const requirePath = path.get('source').node.value;
                            // 参数 trackerPath
                            if (requirePath === options.trackerPath) {
                                const specifierPath = path.get('specifiers.0');
                                if (specifierPath.isImportSpecifier()) {
                                  // 默认导入 import a from 'a'
                                    state.trackerImportId = specifierPath.toString();
                                } else if (specifierPath.isImportNamespaceSpecifier()) {
                                  // name import 导入
                                  // import * as a from 'a'
                                  state.trackerImportId = specifierPath.get('local').toString();
                                }
                                // 找到了就终止遍历
                                path.stop();
                            }
                        }
                    });
                    // 没有引入过就直接引入
                    if (!state.trackerImportId) {
                        state.trackerImportId  = importModule.addDefault(path, 'tracker',{
                            nameHint: path.scope.generateUid('tracker')
                        }).name;
                        state.trackerAST = api.template.statement(`${state.trackerImportId}()`)();
                    }
                }
            },
            // 插入函数调用
            'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) {
                // 是否注释tracker信息 
                const hasComment = (
                  path.node.leadingComments && 
                  parseComment(path.node.leadingComments[0].value) && 
                  parseComment(path.node.leadingComments[0].value).description === 'track'
                )
                // 整个程序体
                const bodyPath = path.get('body');
                if (bodyPath.isBlockStatement()) {
                  // // 有函数体就在开始插入埋点代码
                    if (hasComment) {
                      // const a = () => {
                      //   console.log(111)
                      // }
                      bodyPath.node.body.unshift(state.trackerAST);
                    }
                } else {
                  // // 没有函数体要包裹一下，处理下返回值
                    if (hasComment) {
                      // function a() {}
                      const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({PREV_BODY: bodyPath.node});
                      bodyPath.replaceWith(ast);
                    }
                }
            }
        }
    }
});
module.exports = autoTrackPlugin;
