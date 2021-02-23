
// TypeScript compiler doesn't understand css module imports.
// This satisfies the compiler so it doesn't throw any errors.
// To get actual errors, 'typescript-plugin-css-modules' provides the IDE
// with types.
declare module "*.css"
