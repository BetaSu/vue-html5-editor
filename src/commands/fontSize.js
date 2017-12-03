import commands from './index'

export default function (rh, arg) {
  // through font tag
  if (rh.range.collapsed) {
    let node = rh.range.commonAncestorContainer
    let s =rh.getSelection()
    let row = rh.getRow(node)
    if (row) {
      // commands.insertHTML(rh, '&#8203;')
      // rh.setRangeAt(s.focusNode, true)
      // document.execCommand('styleWithCSS', false, false)
      // document.execCommand('fontSize', false, arg)
      // s.collapse(s.focusNode, 1)

      rh.setRangeAt(row, true)
      document.execCommand('styleWithCSS', false, false)
      document.execCommand('fontSize', false, arg)
      s.collapse(s.focusNode, 1)
      return
    }
  } else {
    document.execCommand('styleWithCSS', false, false)
    document.execCommand('fontSize', false, arg)
  }
}
