// src/main.js
import { createApp } from "vue";
import App from "./App.vue";

import router from "./router";
import { createPinia } from "pinia";

import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import "@wangeditor/editor/dist/css/style.css";
import "./style.css"; // ✅ 全局样式（让后台布局更稳定）
import "./styles/global.css";
import "./styles/element-plus.css";
const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);

app.mount("#app");
