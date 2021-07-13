const types = require ('@babel/types');
const pluginSyntaxJsx = require ('@babel/plugin-syntax-jsx').default;

const pluginTransformReactJsx = {
  inherits: pluginSyntaxJsx,
  visitor: {
    JSXElement (path) {
      let callExpression = buildJSXElementCall(path);
      path.replaceWith(callExpression);
    },
  },
};

function buildJSXElementCall(path) {
  const openingPath = path.get('openingElement');
  // h1
  const {name} = openingPath.node.name;
  const tag = types.stringLiteral(name);
  const args = [tag];
  // 获取jsx属性
  let attributes = [];
  for (const attrPath of openingPath.get('attributes')) {
    attributes.push(attrPath.node);
  }
  // 获取children
  const children = buildChildren(path.node);
  const props = attributes.map(convertAttribute);
  if (children.length > 0) {
    props.push(buildChildrenProperty(children));
  }
  const attributesObject = types.objectExpression(props);
  args.push(attributesObject);
  return call(path, 'jsx', args);
}

function call (path, name, args) {
  const importedSource = 'react/jsx-runtime';
  const callee = addImport(path, name, importedSource);
  const node = types.callExpression(callee, args);
  return node;
}

function addImport (path, importName, importedSource) {
  const programPath = path.find (p => p.isProgram ());
  const scope = programPath.scope;
  // 产生一个不会与本地变量冲突的标识符
  const localName = scope.generateUidIdentifier(importName);
  // 创建倒入语句
  const specifiers = [
    types.importSpecifier(localName, types.identifier(importName)),
  ];
  let statement = types.importDeclaration(
    specifiers,
    types.stringLiteral(importedSource)
  );
  programPath.unshiftContainer('body', [statement]);
  return localName;
}

function buildChildren (node) {
  const elements = [];
  for (let i = 0; i < node.children.length; i++) {
    let child = node.children[i];
    if (types.isJSXText(child)) {
      elements.push(types.stringLiteral(child.value));
    }
  }
  return elements;
}

function buildChildrenProperty (children) {
  let childrenNode;
  if (children.length === 1) {
    childrenNode = children[0];
  } else if (children.length > 1) {
    childrenNode = types.arrayExpression (children);
  } else {
    return undefined;
  }
  return types.objectProperty(types.identifier('children'), childrenNode);
}

function convertAttribute (node) {
  const value = node.value;
  node.name.type = 'Identifier';
  // 对象属性：值
  return types.objectProperty(node.name, value);
}

module.exports = pluginTransformReactJsx;
