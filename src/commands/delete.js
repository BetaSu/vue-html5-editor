import commands from './index'
import constant from '../constant-config'

export default function (rh, e) {
  // restore first row
  let node = rh.range.commonAncestorContainer
  console.log('delete', node)
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
  if (!row) {
    return
  }
  if (rh.range.collapsed && (rh.range.startOffset === 0 || (row.innerHTML.replace(/<br>/g, '') === '' && rh.range.startOffset === 1))) {
    let firstRow = rh.editZone().firstElementChild

    // first row cancel indent
    if (firstRow === row) {
      firstRow.style[constant.INDENT_STYLE_NAME] = ''
      e.preventDefault()
    }
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
