import commands from './index'

export default function (rh, e) {
  let node = rh.range.commonAncestorContainer
  if (node.nodeType === Node.TEXT_NODE) {

    // to keep text wrap by a row
    if (node.parentNode === rh.editZone()) {
      let row = rh.newRow()
      let vContainer = rh.newRow()
      vContainer.appendChild(row)
      row.innerText = node.nodeValue
      node.parentNode.removeChild(node)
      commands.insertHTML(rh, row.outerHTML)
      return
    }
  }
}
