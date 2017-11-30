import commands from './index'

export default function (rh, arg) {
  let s = rh.getSelection()
  if (!s.isCollapsed) {
    document.execCommand('italic', false, arg)
    return
  } else {
    let node = s.focusNode
    let row = rh.getRow(node)
    let nodeCtn = node.innerText || node.nodeValue

    // the outermost italic tag
    let italic = rh.findSpecialAncestor(node, 'i', false, row) || rh.findSpecialAncestorByStyle(node, {
        'fontStyle': 'italic'
      }, false, row)

    // is in a italic
    if (italic) {
      let focusOffset = s.focusOffset

      // cursor is at end of text
      if (nodeCtn.length === focusOffset) {

        // ex: row > i > text + strike  to  row > (i > text + strike) + font
        let existStyle = rh.findExistTagTillBorder(node, ['STRIKE', 'U', 'B', 'STRONG'], row)
        let newText = document.createElement('font')
        if (existStyle.length) {
          let newDOM = rh.createNestDOMThroughList(existStyle)
          rh.insertAfter(newDOM.dom, italic)
          s.collapse(newDOM.deepest, 1)
        } else {
          newText.innerHTML = '&#8203;'
          rh.insertAfter(newText, italic)
          s.collapse(newText, 1)
        }
        return

      } else {
        // cursor is not at end of text, remove style
        rh.setRangeAt(italic, true)
        document.execCommand('italic', false, arg)
        s.collapse(node, focusOffset)
        return
      }
    } else {
      let node = s.focusNode.nodeType === Node.TEXT_NODE ? s.focusNode.parentNode : s.focusNode

      // is in another style tag, create i inside current tag
      if (rh.isInlineElement(node) && rh.isEmptyNode(node)) {
        let newU = document.createElement('i')
        newU.innerHTML = '&#8203;'
        node.appendChild(newU)
        s.collapse(newU, 1)
        return
      } else {
        // at middle of another style tag
        let existStyle = rh.findExistTagTillBorder(node, ['STRIKE', 'U', 'B', 'STRONG'], row)
        existStyle.push('I')
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

      // cursor is not surrounded by a italic tag, create empty italic tag
      commands.insertHTML(rh, '<i>&#8203;</i>')
    }
  }
}

