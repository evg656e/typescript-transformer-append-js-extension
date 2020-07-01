import * as typescript from 'typescript'
import * as path from 'path'
import { PluginConfig } from 'ttypescript/lib/PluginCreator'

interface AppendJSExtensionConfig extends PluginConfig {
	forceInclude?: unknown,
	forceExclude?: unknown
}

const transformer = (_: typescript.Program, config: AppendJSExtensionConfig) => (transformationContext: typescript.TransformationContext) => (sourceFile: typescript.SourceFile) => {
	const forceIncludePath = createForceIncludePath(config);

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
		// only when module specifier has no extension
		if (path.extname(node.moduleSpecifier.text) !== '') return false
		// allow to include user-defined absolute path
		if (forceIncludePath(node.moduleSpecifier.text)) return true
		// only when path is relative
		if (!node.moduleSpecifier.text.startsWith('./') && !node.moduleSpecifier.text.startsWith('../')) return false
		return true
	}

	return typescript.visitNode(sourceFile, visitNode)
}

function isString(value: unknown): value is string {
	return typeof value === 'string'
}

function normalizePatterns(patterns?: unknown) {
	if (!Array.isArray(patterns)) patterns = [patterns]
	return (patterns as unknown[]).filter(isString).map(pattern => new RegExp(pattern))
}

function createForceIncludePath({ forceInclude, forceExclude }: AppendJSExtensionConfig) {
	forceInclude = normalizePatterns(forceInclude)
	forceExclude = normalizePatterns(forceExclude)
	return (path: string) => (forceInclude as RegExp[]).some(re => re.test(path)) && !(forceExclude as RegExp[]).some(re => re.test(path))
}

export default transformer
