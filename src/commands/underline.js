import commands from './index'

export default function (rh, arg) {
  console.log('inin')
  let s = rh.getSelection()
  if (!s.isCollapsed) {
    document.execCommand('underline', false, arg)
    return
  } else {
    let node = rh.range.commonAncestorContainer
    let underline = rh.findSpecialAncestor(node, 'u') || rh.findSpecialAncestorByStyle(node, {
      'textDecorationLine': 'underline'
      })

    // is in a underline
    if (underline) {
      let focusOffset = s.focusOffset

      // cursor is at end of text, create a new node without style
      if (node.length === focusOffset) {
        
        // cursor is at a empty underline tag, remove it
        if (rh.isEmptyNode(node)) {
          node.parentNode.removeChild(node)
          commands.insertHTML(rh, '&#8203;')
          return
        }
        document.execCommand('underline', false, arg)
        commands.insertHTML(rh, '&#8203;')
        return
      } else {

        // cursor is not at end of text, remove style
        rh.setRangeAt(underline, true)
        document.execCommand('underline', false, arg)
        s.collapse(node, focusOffset)
        return
      }
    } else {

      // cursor is not surrounded by a underline tag, create empty underline tag
      commands.insertHTML(rh, '<u>&#8203;</u>')
    }
  }
}
