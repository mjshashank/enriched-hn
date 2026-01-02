import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	define: {
		'import.meta.env.VITE_API_ENDPOINT': JSON.stringify(process.env.VITE_API_ENDPOINT || ''),
	},
	build: {
		outDir: 'dist',
		emptyOutDir: false,
		lib: {
			entry: resolve(__dirname, 'src/content/content.ts'),
			name: 'HNEnricherContent',
			formats: ['iife'],
			fileName: () => 'content.js',
		},
		rollupOptions: {
			output: {
				extend: true,
			},
		},
	},
});
