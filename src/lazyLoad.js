module.exports = function ({ type }) {
  return {
    visitor: {
      ImportDeclaration(path, state = { opts }) {
        const { node } = path;

        if (!node) return;

        const {
          source: { value: libName },
        } = node;

        /**
         * 初始化插件的参数
         * libraryName：必要参数，库名
         * libraryDirectory：默认为lib
         * nameForm：默认转换成’-‘链接的形式，large为转换大驼峰，small为换砖小驼峰
         * toImportQueue：对转换中的个例以key-value形式给予插件，优先级大于nameForm
         */
        const {
          libraryName,
          libraryDirectory = 'lib',
          nameForm = 'default',
          toImportQueue = {},
        } = state.opts;

        /**
         * 检测用户提交的参数是否合法
         * libraryName为必填项
         */
        if (
          !libraryName ||
          typeof libraryName !== 'string' ||
          typeof libraryDirectory !== 'string' ||
          typeof nameForm !== 'string' ||
          Object.prototype.toString.call(toImportQueue) !== '[object Object]'
        )
          assert(libraryName, 'libraryName should be provided');

        /**
         * 对specifiers进行遍历，处理对应节点
         */
        const ids = {};
        const imports = [];
        if (libName === libraryName) {
          node.specifiers.forEach(item => {
            if (t.isImportSpecifier(item)) {
              const {
                local: { name: localName = undefined },
                imported: { name: importedName = undefined },
              } = item;

              if (!localName || !importedName)
                throw path.buildCodeFrameError(
                  'An error occurred in parsing the abstract syntax tree',
                );

              /**
               * 如果当前绑定的引用数量为0，就进行丢弃
               */
              if (path.scope.getBinding(localName).references === 0) return;

              /**
               * 防止变量名在其他作用域中冲突，遂利用generateUid产生一个唯一绑定
               */
              const id = path.scope.generateUid(`_${localName}`);
              ids[localName] = id;

              let horizontal;

              /**
               * 如果用户指定了地址转换的结果，就使用用户提供的
               */
              if (!JSON.stringify(toImportQueue) === '{}') {
                Object.keys(toImportQueue).forEach(key => {
                  if (key === importedName) {
                    horizontal = toImportQueue[key];
                  }
                });
              }

              if (!horizontal) {
                switch (nameForm) {
                  case 'large': {
                    horizontal = importedName[0].toUpperCase() + importedName.substr(1);
                    break;
                  }
                  case 'small': {
                    horizontal = importedName[0].toLowerCase() + importedName.substr(1);
                    break;
                  }
                  default:
                    horizontal = importedName.replace(/([a-zA-Z]+)([A-Z])/g, '$1-$2').toLowerCase();
                }
              }

              imports.push(
                t.importDeclaration(
                  [t.importDefaultSpecifier(t.identifier(id))],
                  t.StringLiteral(`${libraryName}/${libraryDirectory}/${horizontal}/index.js`),
                ),
              );

              /**
               * 查找对目标绑定的所有引用并替换它们
               */
              const currentBinding = path.scope.getBinding(localName);

              currentBinding.referencePaths.forEach(scopePath => {
                const { type } = scopePath;
                if (type === 'JSXIdentifier') {
                  scopePath.replaceWith(t.jSXIdentifier(id));
                } else {
                  scopePath.replaceWith(t.identifier(id));
                }
              });
            } else {
              throw path.buildCodeFrameError('Cannot use default import or namespace import');
            }
          });

          path.replaceWithMultiple(imports);
        }
      },
    },
  };
};