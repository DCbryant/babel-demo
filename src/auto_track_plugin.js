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
    api.assertVersion(7);

    return {
        pre(file) {
          file.set('docs', []);
        },
        post(file) {
          const docs = file.get('docs');
        },
        visitor: {
            Program: {
                enter (path, state) {
                  // 遍历判断是否引入过模块，引入过就停止，否则就引入
                    path.traverse({
                        ImportDeclaration (curPath) {
                            const requirePath = curPath.get('source').node.value;
                            if (requirePath === options.trackerPath) {
                                const specifierPath = curPath.get('specifiers.0');
                                if (specifierPath.isImportSpecifier()) {
                                  // 默认导入
                                    state.trackerImportId = specifierPath.toString();
                                } else if (specifierPath.isImportNamespaceSpecifier()) {
                                  // name import 导入
                                    state.trackerImportId = specifierPath.get('local').toString();
                                }
                                // 找到了就终止遍历
                                path.stop();
                            }
                        }
                    });
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
                const hasComment = (
                  path.node.leadingComments && 
                  parseComment(path.node.leadingComments[0].value) && 
                  parseComment(path.node.leadingComments[0].value).description === 'track'
                )
                const bodyPath = path.get('body');
                if (bodyPath.isBlockStatement()) {
                  // // 有函数体就在开始插入埋点代码
                    if (hasComment) {
                      bodyPath.node.body.unshift(state.trackerAST);
                    }
                } else {
                  // // 没有函数体要包裹一下，处理下返回值
                    if (hasComment) {
                      const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({PREV_BODY: bodyPath.node});
                      bodyPath.replaceWith(ast);
                    }
                }
            }
        }
    }
});
module.exports = autoTrackPlugin;
