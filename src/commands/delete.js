import commands from './index'
import constant from '../constant-config'

export default function (rh, e) {
  // restore first row
  let s = rh.getSelection()
  let node = s.baseNode
  let value = node.nodeValue || node.innerText
  console.log('delete', node, e)
  let curRange = rh.getRange() || rh.range

  // cancel list when li is empty
  if ((rh.findSpecialAncestor(node, 'li')) && rh.range.startOffset === 0) {
    e.preventDefault()
    let ulOrOl = rh.findSpecialAncestor(node, 'ul') || rh.findSpecialAncestor(node, 'ol')
    if (ulOrOl.nodeName === 'UL') {
      commands['insertUnorderedList'](rh, e)
    }
    if (ulOrOl.nodeName === 'OL') {
      commands['insertOrderedList'](rh, e)
    }
    return
  }
  let row = rh.getRow(node)

  // node is edit zone
  if (!row) {
    e.preventDefault()
    return afterDelete(rh)
  }

  // handle &#8203;&#8203;&#8203; in node
  if (node.nodeType === Node.TEXT_NODE && curRange.collapsed) {
    let endOffset = curRange.endOffset - 1 >= 0 ? curRange.endOffset - 1 : 0
    let startOffset = endOffset
    while (node.nodeValue !== undefined && node.nodeValue[startOffset] && node.nodeValue[startOffset].match(/\u200B/)) {
      startOffset--
    }
    if (startOffset !== endOffset) {
      let s = rh.getSelection()
      const newRange = document.createRange()
      newRange.setStart(node, startOffset + 1)
      newRange.setEnd(node, endOffset + 1)
      s.removeAllRanges()
      s.addRange(newRange)
      document.execCommand('forwardDelete', false)
      return
    }
  }

  // empty row
  if (rh.range.collapsed && ((node === row && rh.range.startOffset === 0) || (row.innerHTML.replace(/<br>/g, '') === '' && rh.range.startOffset === 1))) {
    let firstRow = rh.editZone().firstElementChild

    // first row cancel outdent
    if (firstRow === row) {
      commands.outdent(rh, null)
      e.preventDefault()
      return
    }
  }

  // row has content, cursor is at at start of the node, do outdent
  if (rh.range.collapsed && value && rh.range.startOffset === 0 && (node === row.fistElementChild || node === row.firstChild)) {
    commands.outdent(rh, null)
    e.preventDefault()
    return
  }

  // empty row
  if (row.innerHTML.replace(/<br>/g, '') === '') {
    // get previous row with content
    let preRow = rh.getPreviousRow(row)

    // cursor focus on previous row's input if previous row is todo
    if (preRow && preRow.dataset && preRow.dataset.editorTodo) {
      row.parentNode.removeChild(row)
      let input = preRow.querySelector('input[type="text"]')
      if (input) {
        e.preventDefault()
        input.focus()
      }
      e.preventDefault()
      return
    }
  }
  e.preventDefault()
  return afterDelete(rh)
}

// handle more &#8203; after delete
function afterDelete(rh) {
  let deleteInterval = window.setInterval(function () {
    let s = rh.getSelection()
    let focusNode = s.focusNode
    let ctn = typeof focusNode.innerText === 'string' ? focusNode.innerText : focusNode.nodeValue
    if (typeof ctn === 'string' && /\u200B/.test(ctn) && ctn.replace(/\u200B/g, '') === '') {
      document.execCommand('delete', false)
    } else {
      document.execCommand('delete', false)
      window.clearInterval(deleteInterval)
    }
  })

  // if edit zone is empty, create a row
  if (rh.isEmptyNode(rh.editZone()) && !rh.getRows().length) {
    let row = rh.newRow({br: true})
    rh.editZone().appendChild(row)
    rh.getSelection().collapse(row, 1)
  }
}
