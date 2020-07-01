import * as typescript from 'typescript'
import * as path from 'path'

const transformer = (_: typescript.Program) => (transformationContext: typescript.TransformationContext) => (sourceFile: typescript.SourceFile) => {
	function visitNode(node: typescript.Node): typescript.VisitResult<typescript.Node> {
		if (shouldMutateModuleSpecifier(node)) {
			if (typescript.isImportDeclaration(node)
				|| typescript.isExportDeclaration(node)) {
				const newModuleSpecifier = typescript.createStringLiteral(`${node.moduleSpecifier.text}.js`) as typescript.StringLiteral & { singleQuote: boolean };
				newModuleSpecifier.singleQuote = node.moduleSpecifier.getText(sourceFile)[0] === '\'';
				const newNode = typescript.getMutableClone(node)
				newNode.moduleSpecifier = newModuleSpecifier
				return newNode
			}
		}

		return typescript.visitEachChild(node, visitNode, transformationContext)
	}

	function shouldMutateModuleSpecifier(node: typescript.Node): node is (typescript.ImportDeclaration | typescript.ExportDeclaration) & { moduleSpecifier: typescript.StringLiteral } {
		if (!typescript.isImportDeclaration(node) && !typescript.isExportDeclaration(node)) return false
		if (node.moduleSpecifier === undefined) return false
		// only when module specifier is valid
		if (!typescript.isStringLiteral(node.moduleSpecifier)) return false
		// only when path is relative
		if (!node.moduleSpecifier.text.startsWith('./') && !node.moduleSpecifier.text.startsWith('../')) return false
		// only when module specifier has no extension
		if (path.extname(node.moduleSpecifier.text) !== '') return false
		return true
	}

	return typescript.visitNode(sourceFile, visitNode)
}

export default transformer
