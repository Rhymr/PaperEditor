export default {
  root: 'src',
  base: './',
  build: {
    outDir: '../build',
    emptyOutDir: true,
    target: 'esnext',
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.gif', '**/*.webp']
  }
};
