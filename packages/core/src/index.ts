import { HEAD_COUNT_KEY, HEAD_ATTRS_KEY, SELF_CLOSING_TAGS } from "./constants"
import { createElement } from "./create-element"
import { stringifyAttrs } from "./stringify-attrs"
import { isEqualNode } from "./utils"

export type HeadElementAttrs = Record<string, any>

export type HeadElement = { type: string; attrs: HeadElementAttrs }

export type HeadManager = {
  readonly state: {
    title?: string
    elements: HeadElement[]
    htmlAttrs: HeadElementAttrs
    bodyAttrs: HeadElementAttrs
  }

  connect: () => number

  disconnect: (id: number) => void

  set(id: number, elements: (HeadElement | null)[]): void

  effect: (document?: Document) => void
}

export interface HTMLResult {
  // innerHTML of `<head>`
  readonly head: string
  // Attributes for `<html>`
  readonly htmlAttrs: string
  // Attributes for `<body>`
  readonly bodyAttrs: string
}

const getElementKey = (
  attrs: HeadElementAttrs
): { name: string; value: any } | void => {
  const names = ["key", "id", "name", "property"]
  for (const n of names) {
    const value =
      // Probably an HTML Element
      typeof attrs.getAttribute === "function"
        ? attrs.hasAttribute(n)
          ? attrs.getAttribute(n)
          : undefined
        : attrs[n]
    if (value !== undefined) {
      return { name: n, value: value }
    }
  }
}

const acceptElementTypes = [
  "title",
  "meta",
  "link",
  "base",
  "style",
  "script",
  "htmlAttrs",
  "bodyAttrs",
]

const setAttrs = (el: Element, attrs: HeadElementAttrs) => {
  const existingAttrs = el.getAttribute(HEAD_ATTRS_KEY)
  if (existingAttrs) {
    for (const key of existingAttrs.split(",")) {
      if (!(key in attrs)) {
        el.removeAttribute(key)
      }
    }
  }

  const keys: string[] = []

  for (const key in attrs) {
    const value = attrs[key]
    if (value == null) continue

    if (value === false) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, value)
    }

    keys.push(key)
  }

  if (keys.length) {
    el.setAttribute(HEAD_ATTRS_KEY, keys.join(","))
  } else {
    el.removeAttribute(HEAD_ATTRS_KEY)
  }
}

const updateElements = (
  document = window.document,
  type: string,
  elements: HeadElement[]
) => {
  const head = document.head
  let headCountEl = head.querySelector(`meta[name="${HEAD_COUNT_KEY}"]`)
  const headCount = headCountEl
    ? Number(headCountEl.getAttribute("content"))
    : 0
  const oldElements: Element[] = []

  if (headCountEl) {
    for (
      let i = 0, j = headCountEl.previousElementSibling;
      i < headCount;
      i++, j = j?.previousElementSibling || null
    ) {
      if (j?.tagName?.toLowerCase() === type) {
        oldElements.push(j)
      }
    }
  } else {
    headCountEl = document.createElement("meta")
    headCountEl.setAttribute("name", HEAD_COUNT_KEY)
    headCountEl.setAttribute("content", "0")
    head.append(headCountEl)
  }
  let newElements = elements.map((tag) =>
    createElement(document, tag.type, tag.attrs)
  )

  newElements = newElements.filter((newEl) => {
    for (let i = 0; i < oldElements.length; i++) {
      const oldEl = oldElements[i]
      if (isEqualNode(oldEl, newEl)) {
        oldElements.splice(i, 1)
        return false
      }
    }
    return true
  })

  oldElements.forEach((t) => t.parentNode?.removeChild(t))
  newElements.forEach((t) => {
    head.insertBefore(t, headCountEl)
  })
  headCountEl.setAttribute(
    "content",
    "" + (headCount - oldElements.length + newElements.length)
  )
}

export const createHeadManager = () => {
  const all: Record<number, HeadElement[] | undefined> = {}
  let lastId = 0

  const head: HeadManager = {
    /**
     * Get deduped tags
     */
    get state() {
      const deduped: HeadElement[] = []

      const htmlAttrs: HeadElementAttrs = {}
      const bodyAttrs: HeadElementAttrs = {}
      let title: string | undefined
      for (const k in Object.keys(all)) {
        const elements = all[k]
        if (!elements) continue

        for (const element of elements) {
          if (element.type === "title") {
            title = element.attrs.textContent
            continue
          } else if (element.type === "htmlAttrs") {
            Object.assign(htmlAttrs, element.attrs)
            continue
          } else if (element.type === "bodyAttrs") {
            Object.assign(bodyAttrs, element.attrs)
            continue
          } else if (
            element.type === "meta" ||
            element.type === "base" ||
            element.type === "script"
          ) {
            // Remove elements with the same key
            const key = getElementKey(element.attrs)

            if (key) {
              let index = -1

              for (let i = 0; i < deduped.length; i++) {
                const prev = deduped[i]
                const prevValue = prev.attrs[key.name]
                const nextValue = element.attrs[key.name]
                if (prev.type === element.type && prevValue === nextValue) {
                  index = i
                  break
                }
              }

              if (index !== -1) {
                deduped.splice(index, 1)
              }
            }
          }

          deduped.push(element)
        }
      }

      return {
        title,
        elements: deduped,
        htmlAttrs,
        bodyAttrs,
      }
    },

    set(id, elements) {
      all[id] = elements.filter((el) => el) as HeadElement[]
    },

    connect() {
      const id = lastId++
      all[id] = []
      return id
    },

    disconnect(id) {
      all[id] = undefined
    },

    effect(document = window.document) {
      const elements: Record<string, HeadElement[]> = {}
      const state = head.state

      for (const element of state.elements) {
        elements[element.type] = elements[element.type] || []
        elements[element.type].push(element)
      }

      if (state.title !== undefined && state.title !== document.title) {
        document.title = state.title
      }

      setAttrs(document.documentElement, state.htmlAttrs)
      setAttrs(document.body, state.bodyAttrs)

      for (const type of Object.keys(elements)) {
        updateElements(document, type, elements[type])
      }
    },
  }
  return head
}

export const IS_BROWSER = typeof document !== "undefined"

const elementToString = (element: HeadElement) => {
  let attrs = stringifyAttrs(element.attrs)

  if (SELF_CLOSING_TAGS.includes(element.type)) {
    return `<${element.type}${attrs}>`
  }

  return `<${element.type}${attrs}>${
    element.attrs.textContent ?? element.attrs.innerHTML ?? ""
  }</${element.type}>`
}

export const renderToString = (head: HeadManager): HTMLResult => {
  const tags: string[] = []
  const state = head.state

  const title = state.title !== undefined ? `<title>${state.title}</title>` : ""
  for (const element of state.elements) {
    tags.push(elementToString(element))
  }

  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}">`)

  return {
    get head() {
      return title + tags.join("")
    },
    get htmlAttrs() {
      return stringifyAttrs({
        ...state.htmlAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(state.htmlAttrs).join(","),
      })
    },
    get bodyAttrs() {
      return stringifyAttrs({
        ...state.bodyAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(state.bodyAttrs).join(","),
      })
    },
  }
}
