1. 收集依赖：找到 importDeclaration，分析出包 a 和依赖 b,c,d....，假如 a 和 libraryName 一致，就将 b,c,d... 在内部收集起来 

2. 判断是否使用：在多种情况下（比如文中提到的 CallExpression）判断 收集到的 b,c,d... 是否在代码中被使用，如果有使用的，就调用 importMethod 


3. 生成新的 impport 语句 生成引入代码：根据配置项生成代码和样式的 import 语句 