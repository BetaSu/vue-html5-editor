
export default function (rh, e) {
  let node = rh.range.commonAncestorContainer

  // to keep text wrap by a row
  if (node.nodeType === Node.TEXT_NODE && node.parentNode === rh.editZone()) {
    let row = rh.newRow()
    row.innerText = node.nodeValue
    node.parentNode.replaceChild(row, node)
    return
  }
}
