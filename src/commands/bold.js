import commands from './index'

export default function (rh, arg) {
  let s = rh.getSelection()
  if (!s.isCollapsed) {
    document.execCommand('bold', false, arg)
    return
  } else {
    let node = rh.range.commonAncestorContainer
    let underline = rh.findSpecialAncestor(node, 'strong') || rh.findSpecialAncestor(node, 'b') || rh.findSpecialAncestorByStyle(node, {
        'fontWeight': 'bold'
      })

    // is in a strong
    if (underline) {
      let focusOffset = s.focusOffset

      // cursor is at end of text, create a new node without style
      if (node.length === focusOffset) {
        document.execCommand('bold', false, arg)
        commands.insertHTML(rh, '&#8203;')
        return
      } else {

        // cursor is not at end of text, remove style
        rh.setRangeAt(underline, true)
        document.execCommand('bold', false, arg)
        s.collapse(node, focusOffset)
        return
      }
    } else {

      // cursor is not surrounded by a strong tag, create empty strong tag
      commands.insertHTML(rh, '<strong>&#8203;</strong>')
    }
  }
}
