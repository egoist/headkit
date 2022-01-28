import { App, inject, defineComponent, watchEffect, onBeforeUnmount } from "vue"
import {
  createHeadManager,
  HeadManager,
  HeadElementAttrs,
  IS_BROWSER,
  renderToString as _renderToString,
} from "@headkit/core"

const PROVIDE_KEY = Symbol("for-head")

export const renderToString = (head: ReturnType<typeof createHead>) =>
  _renderToString(head.manager)

export const createHead = () => {
  const manager = createHeadManager()
  return {
    manager,
    install(app: App) {
      app.provide(PROVIDE_KEY, manager)
    },
  }
}

const useManager = () => {
  const manager = inject<HeadManager>(PROVIDE_KEY)
  if (!manager) {
    throw new Error("You must call app.use(createHead()) first")
  }
  return manager
}

export const Head = defineComponent({
  name: "Head",
  setup(_, { slots }) {
    const manager = useManager()
    const id = manager.connect()

    const collect = () => {
      const children = slots.default && slots.default()

      const elements = (children || []).map((child) => {
        if (typeof child.type !== "string") return null

        const attrs: HeadElementAttrs = child.props || {}
        if (typeof child.children === "string") {
          attrs.textContent = child.children
        }
        return {
          type: child.type,
          attrs,
        }
      })

      manager.set(id, elements)
    }

    if (!IS_BROWSER) {
      collect()
    }

    watchEffect(() => {
      collect()

      if (IS_BROWSER) {
        manager.effect()
      }
    })

    onBeforeUnmount(() => {
      manager.disconnect(id)
      manager.effect()
    })

    return () => {
      return null
    }
  },
})
