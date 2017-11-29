import commands from './index'
import constant from '../constant-config'

export default function (rh, e) {
  // restore first row
  let node = rh.range.commonAncestorContainer
  let value = node.nodeValue || node.innerText
  console.log('delete', node, e)
  let range = rh.getRange() || rh.range

  // cancel list when li is empty
  if ((rh.findSpecialAncestor(node, 'li')) && rh.range.collapsed && rh.range.startOffset === 0) {
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
  if (!row) return

  // handle &#8203;
  if (node.nodeType === Node.TEXT_NODE && range.collapsed) {
    let endOffset = range.endOffset - 1 >= 0 ? range.endOffset - 1 : 0
    if (node.nodeValue !== undefined && node.nodeValue[endOffset].match(/\u200B/)) {
      let s = rh.getSelection()
      const range = document.createRange()
      range.setStart(node, endOffset)
      range.setEnd(node, endOffset + 1)
      s.removeAllRanges()
      s.addRange(range)
      document.execCommand('forwardDelete', false)
    }
    return
  }

  // empty row
  if (rh.range.collapsed && ((node === row && rh.range.startOffset === 0) || (row.innerHTML.replace(/<br>/g, '') === '' && rh.range.startOffset === 1))) {
    let firstRow = rh.editZone().firstElementChild

    // first row cancel indent
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
      return
    }
  }
}
