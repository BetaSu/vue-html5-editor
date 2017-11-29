import commands from './index'

export default function (rh, arg) {
  let s = rh.getSelection()
  if (!s.isCollapsed) {
    document.execCommand('strikeThrough', false, arg)
    return
  } else {
    let node = rh.range.commonAncestorContainer
    let underline = rh.findSpecialAncestor(node, 'strike') || rh.findSpecialAncestorByStyle(node, {
        'textDecorationLine': 'line-through'
      })

    // is in a underline
    if (underline) {
      let focusOffset = s.focusOffset

      // cursor is at end of text, create a new node without style
      if (node.length === focusOffset) {
        document.execCommand('strikeThrough', false, arg)
        commands.insertHTML(rh, '&#8203;')
        return
      } else {

        // cursor is not at end of text, remove style
        rh.setRangeAt(underline, true)
        document.execCommand('strikeThrough', false, arg)
        s.collapse(node, focusOffset)
        return
      }
    } else {

      // cursor is not surrounded by a underline tag, create empty underline tag
      commands.insertHTML(rh, '<strike>&#8203;</strike>')
    }
  }
}
