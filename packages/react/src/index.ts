import React, { createContext, useContext, useEffect, useMemo } from "react"
import {
  HeadManager,
  IS_BROWSER,
  createHeadManager,
  renderToString,
} from "@headkit/core"

const HeadContext = createContext<HeadManager | null>(null)

export const HeadProvider = HeadContext.Provider

export { createHeadManager, renderToString }

const useManager = () => {
  const manager = useContext(HeadContext)
  if (!manager) {
    throw new Error("You must use <HeadProvider> first")
  }
  return manager
}

const getElements = (node: React.ReactNode) => {
  const nodes = React.Children.toArray(node)

  return nodes.map((node) => {
    if (!React.isValidElement(node)) return null
    if (typeof node.type !== "string") return null

    const attrs = { ...node.props }
    if (attrs.children) {
      const nodes = React.Children.toArray(attrs.children)
      attrs.textContent = nodes.join("")
      attrs.children = undefined
    }
    if (attrs.dangerouslySetInnerHTML) {
      attrs.innerHTML = attrs.dangerouslySetInnerHTML.__html
      attrs.dangerouslySetInnerHTML = undefined
    }
    if (attrs.className) {
      attrs.class = attrs.className
      attrs.className = undefined
    }
    return {
      type: node.type,
      attrs,
    }
  })
}

export const Head: React.FC = ({ children }) => {
  const manager = useManager()
  const id = useMemo(() => manager.connect(), [])

  const collect = () => {
    const elements = getElements(children)
    manager.set(id, elements)
  }

  if (!IS_BROWSER) {
    collect()
  }

  useEffect(() => {
    collect()
    manager.effect()

    return () => {
      manager.disconnect(id)
      manager.effect()
    }
  }, [children])

  return null
}
