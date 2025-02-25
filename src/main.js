import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import "./style.css";
import App from "./App.vue";
import "ant-design-vue/dist/reset.css";

const pinia = createPinia();

createApp(App).use(router).use(pinia).mount("#app");
