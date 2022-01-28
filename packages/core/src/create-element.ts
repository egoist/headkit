export const createElement = (
  document: Document,
  tag: string,
  attrs: { [k: string]: any }
) => {
  const el = document.createElement(tag)

  for (const key of Object.keys(attrs)) {
    let value = attrs[key]

    if (key === "key" || value === false) {
      continue
    }

    if (key === "textContent") {
      el.textContent = value
    } else if (key === "innerHTML") {
      el.innerHTML = value
    } else {
      el.setAttribute(key, value)
    }
  }

  return el
}
