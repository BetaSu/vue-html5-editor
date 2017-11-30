import commands from './index'

export default function (rh, arg) {
  let s = rh.getSelection()
  if (!s.isCollapsed) {
    document.execCommand('underline', false, arg)
    return
  } else {
    let node = s.focusNode
    let row = rh.getRow(node)
    let nodeCtn = node.innerText || node.nodeValue

    // the outermost underline tag
    let underline = rh.findSpecialAncestor(node, 'u', false, row) || rh.findSpecialAncestorByStyle(node, {
      'textDecorationLine': 'underline'
      }, false, row)

    // is in a underline
    if (underline) {
      let focusOffset = s.focusOffset

      // cursor is at end of text
      if (nodeCtn.length === focusOffset) {

        // ex: row > u > text + strike  to  row > (u > text + strike) + font
        let existStyle = rh.findExistTagTillBorder(node, ['STRIKE', 'I', 'B', 'STRONG'], row)
        let newText = document.createElement('font')
        if (existStyle.length) {
          let newDOM = rh.createNestDOMThroughList(existStyle)
          rh.insertAfter(newDOM.dom, underline)
          s.collapse(newDOM.deepest, 1)
        } else {
          newText.innerHTML = '&#8203;'
          rh.insertAfter(newText, underline)
          s.collapse(newText, 1)
        }
        return

      } else {
        // cursor is not at end of text, remove style
        rh.setRangeAt(underline, true)
        document.execCommand('underline', false, arg)
        s.collapse(node, focusOffset)
        return
      }
    } else {
      let node = s.focusNode.nodeType === Node.TEXT_NODE ? s.focusNode.parentNode : s.focusNode

      // is in another style tag, create u inside current tag
      if (rh.isInlineElement(node) && rh.isEmptyNode(node)) {
        let newU = document.createElement('u')
        newU.innerHTML = '&#8203;'
        node.appendChild(newU)
        s.collapse(newU, 1)
        return
      } else {
        // at middle of another style tag
        let existStyle = rh.findExistTagTillBorder(node, ['STRIKE', 'I', 'B', 'STRONG'], row)
        existStyle.push('U')
        if (existStyle.length) {
          let newDOM = rh.createNestDOMThroughList(existStyle)
          let v = rh.newRow()
          v.appendChild(newDOM.dom)
          commands.insertHTML(rh, v.innerHTML)
          let deepestNode = document.getElementById(newDOM.deepestId)
          s.collapse(deepestNode, 1)
          return
        }
      }

      // cursor is not surrounded by a underline tag, create empty underline tag
      commands.insertHTML(rh, '<u>&#8203;</u>')
    }
  }
}
