import commands from './index'

export default function (rh, arg) {
  let s = rh.getSelection()
  if (!s.isCollapsed) {
    document.execCommand('underline', false, arg)
    return
  } else {
    let node = rh.range.commonAncestorContainer
    let underline = rh.findSpecialAncestor(node, 'u') || rh.findSpecialAncestorByStyle(node, {
      'textDecorationLine': 'underline'
      })
    if (underline) {
      let focusOffset = s.focusOffset

      // cursor is at end of text, create empty underline tag
      if (node.length === focusOffset) {
        console.log('end!!!')
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
