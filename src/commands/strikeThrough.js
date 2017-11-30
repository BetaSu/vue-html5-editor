import commands from './index'

export default function (rh, arg) {
  console.log('inin')
  let s = rh.getSelection()
  if (!s.isCollapsed) {
    document.execCommand('strikeThrough', false, arg)
    return
  } else {
    let node = s.focusNode
    let row = rh.getRow(node)
    let nodeCtn = node.innerText || node.nodeValue

    // the outermost strikeThrough tag
    let strikeThrough = rh.findSpecialAncestor(node, 'STRIKE', false, row) || rh.findSpecialAncestorByStyle(node, {
        'textDecorationLine': 'line-through'
      }, false, row)

    // is in a strikeThrough
    if (strikeThrough) {
      let focusOffset = s.focusOffset

      // cursor is at end of text
      if (nodeCtn.length === focusOffset) {

        // tag has content
        let existStyle = rh.findExistTagTillBorder(node, ['U', 'I', 'B', 'STRONG'], row)
        let newText = document.createElement('font')
        if (existStyle.length) {
          let newDOM = rh.createNestDOMThroughList(existStyle)
          rh.insertAfter(newDOM.dom, strikeThrough)
          s.collapse(newDOM.deepest, 1)
        } else {
          newText.innerHTML = '&#8203;'
          rh.insertAfter(newText, strikeThrough)
          s.collapse(newText, 1)
        }
        return
      } else {
        // cursor is not at end of text, remove style
        rh.setRangeAt(strikeThrough, true)
        document.execCommand('strikeThrough', false, arg)
        s.collapse(node, focusOffset)
        return
      }
    } else {
      let node = s.focusNode.nodeType === Node.TEXT_NODE ? s.focusNode.parentNode : s.focusNode

      // is in another style tag, create STRIKE inside current tag
      if (rh.isInlineElement(node) && rh.isEmptyNode(node)) {
        let newU = document.createElement('strike')
        newU.innerHTML = '&#8203;'
        node.appendChild(newU)
        s.collapse(newU, 1)
        return
      } else {
        // at middle of another style tag
        let existStyle = rh.findExistTagTillBorder(node, ['U', 'I', 'B', 'STRONG'], row)
        existStyle.push('STRIKE')
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

      // cursor is not surrounded by a strikeThrough tag, create empty strikeThrough tag
      commands.insertHTML(rh, '<STRIKE>&#8203;</STRIKE>')
    }
  }
}
