import commands from './index'

export default function (rh, arg) {
  // through font tag
  if (rh.range.collapsed) {
    let node = rh.range.commonAncestorContainer
    let row = rh.getRow(node)
    if (row) {
      let s =rh.getSelection()
      commands.insertHTML(rh, '&#8203;')
      const range = document.createRange()
      range.setStart(s.focusNode, s.anchorOffset - 1)
      range.setEnd(s.focusNode, s.focusOffset)
      s.removeAllRanges()
      s.addRange(range)
      document.execCommand('styleWithCSS', false, true)
      document.execCommand('fontSize', false, arg)
      s.collapse(s.focusNode, 1)
      return
    }
  } else {
    document.execCommand('styleWithCSS', false, true)
    document.execCommand('fontSize', false, arg)
  }
}
