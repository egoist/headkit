import { createApp, h } from "vue"
import { createHead } from "@headkit/vue"
import { createRouter, createWebHistory, RouterView } from "vue-router"

const app = createApp({
  setup() {
    return () => h(RouterView)
  },
})
app.use(createHead())
app.use(
  createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: "/",
        component: () => import("./pages/home.vue"),
      },
      {
        path: "/about",
        component: () => import("./pages/about.vue"),
      },
    ],
  })
)

app.mount("#app")
