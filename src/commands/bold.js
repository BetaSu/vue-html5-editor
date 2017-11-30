import commands from './index'

export default function (rh, arg) {
  let s = rh.getSelection()
  if (!s.isCollapsed) {
    document.execCommand('bold', false, arg)
    return
  } else {
    let node = s.focusNode
    let row = rh.getRow(node)
    let nodeCtn = node.innerText || node.nodeValue

    // the outermost bold tag
    let bold = rh.findSpecialAncestor(node, 'strong') || rh.findSpecialAncestor(node, 'b') || rh.findSpecialAncestorByStyle(node, {
        'fontWeight': 'bold'
      })

    // is in a bold
    if (bold) {
      let focusOffset = s.focusOffset

      // cursor is at end of text
      if (nodeCtn.length === focusOffset) {

        // ex: row > b > text + strike  to  row > (b > text + strike) + font
        let existStyle = rh.findExistTagTillBorder(node, ['STRIKE', 'I', 'U'], row)
        let newText = document.createElement('font')
        if (existStyle.length) {
          let newDOM = rh.createNestDOMThroughList(existStyle)
          rh.insertAfter(newDOM.dom, bold)
          s.collapse(newDOM.deepest, 1)
        } else {
          newText.innerHTML = '&#8203;'
          rh.insertAfter(newText, bold)
          s.collapse(newText, 1)
        }
        return

      } else {
        // cursor is not at end of text, remove style
        rh.setRangeAt(bold, true)
        document.execCommand('bold', false, arg)
        s.collapse(node, focusOffset)
        return
      }
    } else {
      let node = s.focusNode.nodeType === Node.TEXT_NODE ? s.focusNode.parentNode : s.focusNode

      // is in another style tag, create b inside current tag
      if (rh.isInlineElement(node) && rh.isEmptyNode(node)) {
        let newU = document.createElement('b')
        newU.innerHTML = '&#8203;'
        node.appendChild(newU)
        s.collapse(newU, 1)
        return
      } else {
        // at middle of another style tag
        let existStyle = rh.findExistTagTillBorder(node, ['STRIKE', 'I', 'U'], row)
        existStyle.push('B')
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

      // cursor is not surrounded by a bold tag, create empty bold tag
      commands.insertHTML(rh, '<b>&#8203;</b>')
    }
  }
}
