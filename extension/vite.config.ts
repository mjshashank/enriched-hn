import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'fs';

// Get API endpoint from env, with fallback
const apiEndpoint = process.env.VITE_API_ENDPOINT || 'https://your-api.workers.dev';

// Plugin to copy static assets and process manifest.json
function copyStaticAssets() {
	return {
		name: 'copy-static-assets',
		closeBundle() {
			// Read, process, and write manifest.json
			const manifestPath = resolve(__dirname, 'manifest.json');
			const manifestContent = readFileSync(manifestPath, 'utf-8');

			// Replace placeholder with actual API endpoint (add /* for host_permissions pattern)
			const processedManifest = manifestContent.replace(
				'VITE_API_ENDPOINT_PLACEHOLDER',
				`${apiEndpoint}/*`
			);

			writeFileSync(resolve(__dirname, 'dist/manifest.json'), processedManifest);

			// Copy icons
			const iconsDir = resolve(__dirname, 'dist/icons');
			if (!existsSync(iconsDir)) {
				mkdirSync(iconsDir, { recursive: true });
			}
			if (existsSync(resolve(__dirname, 'public/icons'))) {
				cpSync(resolve(__dirname, 'public/icons'), iconsDir, { recursive: true });
			}
		},
	};
}

export default defineConfig({
	plugins: [react(), copyStaticAssets()],
	base: './',
	define: {
		'import.meta.env.VITE_API_ENDPOINT': JSON.stringify(process.env.VITE_API_ENDPOINT || ''),
	},
	build: {
		outDir: 'dist',
		emptyDirBeforeWrite: true,
		rollupOptions: {
			input: {
				popup: resolve(__dirname, 'src/popup/index.html'),
			},
			output: {
				entryFileNames: 'assets/[name]-[hash].js',
				chunkFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]',
			},
		},
	},
});
