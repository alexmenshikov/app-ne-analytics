import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})


////
////
// import { fileURLToPath, URL } from "node:url";
//
// import { defineConfig } from "vite";
// import vue from "@vitejs/plugin-vue";
//
// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [vue()],
//   resolve: {
//     alias: {
//       "@": fileURLToPath(new URL("./src", import.meta.url)),
//     },
//     optimizeDeps: {
//       include: [
//         "@ant-design/icons-vue",
//         "ant-design-vue",
//         "dayjs",
//         "vue",
//         "vue-router",
//         "vuedraggable",
//         "maska",
//         "axios",
//         "@marcoschulte/vue3-progress",
//       ],
//     },
//   },
//   css: {
//     preprocessorOptions: {
//       less: {
//         javascriptEnabled: true,
//       },
//     },
//   },
// });

