const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Ensure Metro knows the project root (important for pnpm layouts)
config.projectRoot = projectRoot;

// Critical for pnpm
config.resolver.unstable_enablePackageExports = true;

// Support TypeScript: extend default sourceExts instead of overwriting
config.resolver.sourceExts = Array.from(new Set([...(config.resolver.sourceExts || []), 'ts', 'tsx']));

// Help Metro resolve your project correctly
config.watchFolders = config.watchFolders || [];
config.watchFolders.push(projectRoot);

// Add the parent directory (monorepo root) to the watch folders to enable importing from the root
config.watchFolders.push(path.resolve(projectRoot, '..'));

// Configure resolver to look for modules in the root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, '../node_modules'),
];

module.exports = config;