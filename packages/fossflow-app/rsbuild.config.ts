import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'path';
import fs from 'fs';

// Load .env files from monorepo root
const monorepoRoot = path.resolve(__dirname, '../..');
loadEnv({ cwd: monorepoRoot });

// Use the hoisted react/react-dom from root node_modules to ensure single instance
// This prevents the "ReactCurrentOwner is undefined" error when fossflow bundles its own react
const rootNodeModules = path.resolve(monorepoRoot, 'node_modules');
const reactPath = fs.realpathSync(path.resolve(rootNodeModules, 'react'));
const reactDomPath = fs.realpathSync(
  path.resolve(rootNodeModules, 'react-dom')
);
// Force fossflow to always resolve to the local workspace package (prevents pnpm store fossflow@1.0.5)
const fossflowLibPath = fs.realpathSync(
  path.resolve(monorepoRoot, 'packages/fossflow-lib')
);

const publicUrl = process.env.PUBLIC_URL || '';
const assetPrefix = publicUrl
  ? publicUrl.endsWith('/')
    ? publicUrl
    : publicUrl + '/'
  : '/';

export default defineConfig({
  plugins: [pluginReact()],
  resolve: {
    alias: {
      react: reactPath,
      'react-dom': reactDomPath,
      fossflow: fossflowLibPath
    }
  },
  html: {
    template: './public/index.html',
    templateParameters: {
      assetPrefix: assetPrefix
    }
  },
  source: {
    // Define global constants that will be replaced at build time
    define: {
      'process.env.PUBLIC_URL': JSON.stringify(publicUrl),
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'production'
      ),
      'process.env.AI_API_ENDPOINT': JSON.stringify(
        process.env.AI_API_ENDPOINT || ''
      ),
      'process.env.AI_API_KEY': JSON.stringify(process.env.AI_API_KEY || ''),
      'process.env.AI_MODEL': JSON.stringify(process.env.AI_MODEL || ''),
      'process.env.AI_TEMPERATURE': JSON.stringify(
        process.env.AI_TEMPERATURE || '0.7'
      ),
      'process.env.AI_MAX_TOKENS': JSON.stringify(
        process.env.AI_MAX_TOKENS || '4096'
      ),
      'process.env.DEFAULT_LANGUAGE': JSON.stringify(
        process.env.DEFAULT_LANGUAGE || ''
      )
    }
  },
  output: {
    distPath: {
      root: 'build'
    },
    // https://rsbuild.rs/guide/advanced/browser-compatibility
    polyfill: 'usage',
    assetPrefix: assetPrefix,
    copy: [
      {
        from: './src/i18n',
        to: 'i18n/app'
      }
    ]
  }
});
