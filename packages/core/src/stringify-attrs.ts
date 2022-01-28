const htmlEscape = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

export const stringifyAttrs = (attributes: any) => {
  const handledAttributes = []

  for (let [key, value] of Object.entries(attributes)) {
    if (key === "children" || key === "key") {
      continue
    }

    if (value === false || value == null) {
      continue
    }

    let attribute = htmlEscape(key)

    if (value !== true) {
      attribute += `="${htmlEscape(String(value))}"`
    }

    handledAttributes.push(attribute)
  }

  return handledAttributes.length > 0 ? " " + handledAttributes.join(" ") : ""
}
