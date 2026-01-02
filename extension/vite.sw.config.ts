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
			entry: resolve(__dirname, 'src/background/service-worker.ts'),
			name: 'HNEnricherSW',
			formats: ['iife'],
			fileName: () => 'service-worker.js',
		},
		rollupOptions: {
			output: {
				extend: true,
			},
		},
	},
});
