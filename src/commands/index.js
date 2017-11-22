import insertImage from './insertImage'
import { isObj } from '../util'

const commands = {
  /*
   * add a style attribute in range
   * @param {obj} arg include
   *      key: style name
   *      value: style value
   **/
  addStyle (rh, arg) {
    function doAdd(node) {
      Object.keys(arg).forEach(styleName => {
        node.style[styleName] = arg[styleName]
      })
    }
    if (!isObj(arg)) return
    const textNodes = rh.getAllTextNodesInRange()
    if (!textNodes.length) {
      if (rh.range.collapsed) {
        let node = rh.range.commonAncestorContainer
        if (node.nodeType === Node.ELEMENT_NODE) {
          doAdd(node)
          return
        }
      }
    }
    if (rh.range.collapsed && textNodes.length === 1) {
      let node = textNodes[0].parentNode
      if (node) {
        if (node === rh.editZone()) {
          let newRow = rh.newRow({tag: 'p'})
          newRow.innerText = textNodes[0].nodeValue
          node.replaceChild(newRow, textNodes[0])
          doAdd(newRow)
          return
        }
        doAdd(node)
        return
      }
    }
    if (textNodes.length === 1 && textNodes[0] === rh.range.startContainer
      && textNodes[0] === rh.range.endContainer) {
      const textNode = textNodes[0]
      if (rh.range.startOffset === 0
        && rh.range.endOffset === textNode.textContent.length) {
        if (textNode.parentNode.childNodes.length === 1
          && rh.isInlineElement(textNode.parentNode)) {
          doAdd(textNode.parentNode)
          return
        }
        const span = document.createElement('span')
        doAdd(span)
        textNode.parentNode.insertBefore(span, textNode)
        span.appendChild(textNode)
        return
      }
      const span = document.createElement('span')
      span.innerText = textNode.textContent.substring(
        rh.range.startOffset, rh.range.endOffset)
      doAdd(span)
      const frontPart = document.createTextNode(
        textNode.textContent.substring(0, rh.range.startOffset))
      textNode.parentNode.insertBefore(frontPart, textNode)
      textNode.parentNode.insertBefore(span, textNode)
      textNode.textContent = textNode.textContent.substring(rh.range.endOffset)
      rh.range.setStart(span, 0)
      rh.range.setEnd(span, 1)
      return
    }

    textNodes.forEach((textNode) => {
      if (textNode === rh.range.startContainer) {
        if (rh.range.startOffset === 0) {
          if (textNode.parentNode.childNodes.length === 1
            && rh.isInlineElement(textNode.parentNode)) {
            doAdd(textNode.parentNode)
          } else {
            const span = document.createElement('span')
            doAdd(span)
            textNode.parentNode.insertBefore(span, textNode)
            span.appendChild(textNode)
          }
          return
        }
        const span = document.createElement('span')
        textNode.textContent = textNode.textContent.substring(
          0, rh.range.startOffset)
        doAdd(span)
        textNode.parentNode.insertBefore(span, textNode)
        rh.range.setStart(textNode, 0)
        return
      }
      if (textNode === rh.range.endContainer) {
        if (rh.range.endOffset === textNode.textContent.length) {
          if (textNode.parentNode.childNodes.length === 1
            && rh.isInlineElement(textNode.parentNode)) {
            doAdd(textNode.parentNode)
          } else {
            const span = document.createElement('span')
            doAdd(span)
            textNode.parentNode.insertBefore(span, textNode)
            span.appendChild(textNode)
          }
          return
        }
        const span = document.createElement('span')
        textNode.textContent = textNode.textContent.substring(rh.range.endOffset)
        doAdd(span)
        textNode.parentNode.insertBefore(span, textNode)
        span.appendChild(textNode)
        rh.range.setStart(textNode, textNode.textContent.length)
        return
      }
      if (textNode.parentNode.childNodes.length === 1
        && rh.isInlineElement(textNode.parentNode)) {
        doAdd(textNode.parentNode)
        return
      }

      const span = document.createElement('span')
      doAdd(span)
      textNode.parentNode.insertBefore(span, textNode)
      span.appendChild(textNode)
    })
    return
  },
  'formatBlock' (rh, arg) {
    if (document.execCommand('formatBlock', false, arg)) {
      return
    }
    // hack
    const element = document.createElement(arg)
    rh.range.surroundContents(element)
    return
  },
  'lineHeight' (rh, arg) {
    const textNodes = rh.getAllTextNodesInRange()
    textNodes.forEach((textNode) => {
      const parentBlock = rh.getParentBlockNode(textNode)
      if (parentBlock) {
        parentBlock.style.lineHeight = arg
      }
    })
    return
  },
  'insertHTML' (rh, arg) {
    if (document.execCommand('insertHTML', false, arg)) {
      return
    }
    // hack
    const fragment = document.createDocumentFragment()
    const div = document.createElement('div')
    div.innerHTML = arg
    if (div.hasChildNodes()) {
      for (let i = 0; i < div.childNodes.length; i++) {
        fragment.appendChild(div.childNodes[i].cloneNode(true))
      }
    }
    rh.range.deleteContents()
    rh.range.insertNode(fragment)
    return
  },
  // unorderedList's insert and indent logic
  'listIndent' (rh, arg) {
    const range = rh.range
    const startContainer = range.startContainer
    const parent = rh.getParentBlockNode(startContainer)
    let curLevel = rh.howManyNestAncestorSameTag(rh.range.commonAncestorContainer, 'UL')
    if (parent === rh.editZone()) {
      return document.execCommand('insertUnorderedList', false, arg)
    } else {
      if (parent.nodeName === 'LI') {
        const pre = parent.previousSibling
        if (pre && pre.nodeName === 'LI') {
          // 0代表已取消缩进，下一次操作变为1级缩进
          // 12代表1级缩进，下一次操作变为2级缩进
          // 2代表2级缩进，下一次操作变为1级缩进
          // 10代表1级缩进，下一次操作取消缩进
          let curIndent = pre.getAttribute('data-editor-siblingindentlevel')
          switch (curIndent) {
            case null:
              if (curLevel >= 10) return
              pre.setAttribute('data-editor-siblingindentlevel', '10')
              document.execCommand('indent', false)
              break
            case '10':
              pre.setAttribute('data-editor-siblingindentlevel', '12')
              document.execCommand('insertUnorderedList', false, arg)
              break
            case '12':
              if (curLevel >= 10) return
              pre.setAttribute('data-editor-siblingindentlevel', '10')
              document.execCommand('indent', false)
              break
          }
          return
        }
        if (pre && pre.nodeName === 'UL') {
          if (curLevel >= 10) return
          return document.execCommand('indent', false)
        }
        return document.execCommand('insertUnorderedList', false, arg)
      }
      if (parent.nodeName === 'UL') {

      }
    }
    if (curLevel >= 10) return
    document.execCommand('indent', false)
  },
  'indent' (rh, arg) {
    let node = rh.range.commonAncestorContainer
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode
    }
    let nestNode = 'BLOCKQUOTE'
    if (node.nodeName === 'LI' || node.nodeName === 'UL') {
      nestNode = 'UL'
    }
    let curLevel = rh.howManyNestAncestorSameTag(node, nestNode)
    // max level == 10
    if (curLevel >= 10) return
    document.execCommand('indent', false, arg)
  },
  // treat normal indent and list indent differently
  'smartIndent' (rh, arg) {
    // let startContainer = rh.range.startContainer
    // const parent = rh.getParentBlockNode(startContainer)
    // if (parent.nodeName === 'UL' || parent.nodeName === 'LI') {
    //   commands['listIndent'](rh, arg)
    // } else {
    //   if (startContainer.nodeType === 3) {
    //     startContainer = parent
    //   }
    //   const ulNum = rh.getNodeNum(startContainer, 'ul')
    //   let pre_listNum = startContainer.getAttribute('data-editor-ulNum')
    //   if (pre_listNum && Number(pre_listNum) < ulNum) {
    //     return commands['listIndent'](rh, arg)
    //   }
    //   startContainer.setAttribute('data-editor-ulNum', ulNum)
    //   commands['indent'](rh, arg)
    // }
    let startContainer = rh.range.startContainer
    commands['indent'](rh, arg)
  },
  // only set contenteditable:false in parent node can child node trigger keydown listener
  'quote' (rh, isInQuote) {
    console.log('quote!')
    if (isInQuote) {
      let node = rh.range.commonAncestorContainer
      node = node.nodeType === Node.TEXT_NODE ? node.parentNode : node
      let quote = rh.findSpecialAncestor(node, '[data-editor-quote]')
      if (quote) {
        let texts = rh.getDescendantTextNodes(quote)
        let newContainer = rh.newRow()
        let quoteRows = []
        texts.forEach(text => {
          // find p in current quote row
          let row = rh.findSpecialAncestor(text, 'p', false, quote)
          // maybe have bug
          if (!row) {
            row = rh.findSpecialAncestor(text, 'div', false, quote)
          }
          if (!quoteRows.includes(row)) {
            quoteRows.push(row)
          }
        })
        quoteRows.forEach(qr => {
          newContainer.appendChild(qr)
        })
        quote.parentNode.replaceChild(newContainer, quote)
      }
      return
    }
    const texts = rh.getAllTextNodesInRange()
    if (!texts.length) {
      texts.push(document.createTextNode(''))
    }

    let container = rh.newRow()
    let br = document.createElement('br')
    let quoteBlock = document.createElement('section')
    let quoteBlockDiv = rh.newRow({tag: 'div'})
    quoteBlock.appendChild(quoteBlockDiv)
    let id = rh.createRandomId('quote')
    quoteBlock.setAttribute('data-editor-quote', id)
    quoteBlock.setAttribute('contenteditable', 'false')
    let quoteRows = []
    texts.forEach((text, index) => {
      if (!text.parentNode) {
        quoteRows.push(rh.newRow({br: true}))
        return
      }
      let curRow = rh.getRow(text)
      if (curRow && !quoteRows.includes(curRow)) {
        quoteRows.push(curRow)
      }
    })
    quoteRows.forEach(qr => {
      const quoteRowContainer = rh.newRow({
        tag: 'div'
      })
      quoteRowContainer.appendChild(qr)
      quoteBlockDiv.appendChild(quoteRowContainer)
    })
    container.appendChild(quoteBlock)
    container.appendChild(br)
    let aNode = rh.range.commonAncestorContainer
    // if range is not at edit zone, insertHTML would run fail
    if (aNode !== rh.editZone()) {
      aNode.parentNode.removeChild(aNode)
    }
    commands['insertHTML'](rh, container.innerHTML)
    const quote = document.querySelector(`[data-editor-quote='${id}']`)
    if (!quote.lastElementChild) return
    rh.getSelection().collapse(quote.lastElementChild, quote.lastElementChild.innerText ? 1 : 0)
  },
  'initQuote' (rh, arg) {
    document.addEventListener('keydown', e => {
      let quote = rh.findSpecialAncestor(e.target, '[data-editor-quote]')
      if (quote) {
        let s = rh.getSelection()
        let node = s.anchorNode
        let ctn = node.innerText || node.nodeValue
        if (e.keyCode === 13) {
          if (ctn.replace('\n', '') === '') {
            e.preventDefault()
            let sibling = quote.nextSibling
            if (!sibling || sibling.innerHTML === '') {
              sibling = rh.newRow({
                br: true
              })
              rh.insertAfter(sibling, quote)
            }
            node.parentNode.removeChild(node)
            rh.getSelection().collapse(sibling, 0)
          }
        }
        if (e.keyCode === 8) {
          if (ctn.replace('\n', '') === '' &&
            (node.parentNode === quote || (node.parentNode.nodeName === 'DIV' && node === node.parentNode.firstElementChild))) {
            let newRow = rh.newRow({br: true})
            quote.parentNode.replaceChild(newRow, quote)
            rh.getSelection().collapse(newRow, 1)
            return
          }
          if (s.isCollapsed && s.focusOffset === 0) {
            let quoteRow = rh.findSpecialAncestor(node, 'div')
            let rows = Array.from(quoteRow.parentNode.querySelectorAll('div'))
            rows.forEach((row, index) => {
              if (row === quoteRow && index === 0) {
                e.preventDefault()
                let preRow = rh.getRow(quote.previousElementSibling)
                if (preRow) {
                  rh.getSelection().collapse(preRow, 0)
                }
              }
            })
          }
        }
      }
    })
  },
  'todo' (rh, afterWhich) {
    let row = rh.newRow({
      br: true
    })
    afterWhich = rh.getRow(afterWhich || rh.range.commonAncestorContainer)
    if (afterWhich && afterWhich !== rh.editZone()) {
      let targetIndex
      let startIndex
      let list = afterWhich.parentNode.childNodes
      list.forEach((child, index) => {
        if (child === afterWhich) {
          startIndex = index
          if (startIndex === list.length - 1) {
            targetIndex = list.length
          }
          return
        }
        if (startIndex !== undefined && targetIndex === undefined) {
          if (child && child.getAttribute('data-editor-todo')) {
            targetIndex = index
          }
        }
      })
      targetIndex = targetIndex === undefined ? startIndex + 1 : targetIndex
      afterWhich.parentNode.insertBefore(row, list[targetIndex])
      rh.getSelection().collapse(row, 0)
    } else {
      afterWhich.appendChild(row, 0)
      rh.getSelection().collapse(row, 0)
    }
    let todoId = rh.createRandomId('todo')
    commands['insertHTML'](rh, `<p data-editor-todo=${todoId} contenteditable="false"><input type="checkbox"/><input type="text" placeholder="待办事项"></p><br>`)
    document.querySelector(`[data-editor-todo='${todoId}'] input[type=text]`).focus()
    if (row) {
      let br = row.querySelector('br')
      row.removeChild(br)
    }
    commands['initTodo'](rh, afterWhich)
  },
  // init todo logic
  'initTodo' (rh, arg) {
    const checkboxs = document.querySelectorAll('[data-editor-todo]')
    checkboxs.forEach((c, index) => {
      const btn = c.querySelector('[type=checkbox]')
      const ctn = c.querySelector('[type=text]')
      if (c.init) return
      ctnCheckedLogic()

      function ctnCheckedLogic() {
        ctn.setAttribute('data-editor-value', ctn.value)
        if (btn.checked) {
          ctn.style.textDecoration = 'line-through'
          btn.setAttribute('checked', '')
        } else {
          ctn.style.textDecoration = 'none'
          btn.removeAttribute('checked')
        }

      }

      btn.onchange = e => {
        ctnCheckedLogic()
        if (rh.editor && rh.editor.$refs && rh.editor.$refs.content) {
          rh.editor.$emit('change', rh.editor.$refs.content.innerHTML)
        }
      }
      ctn.oninput = e => {
        ctn.setAttribute('data-editor-value', e.target.value)
      }
      ctn.onkeydown = ctn.onkeydown || (e => {
          if (![13, 8].includes(e.keyCode)) return
          let row = c.nextSibling
          // if (!row || !row.getAttribute('[data-editor-row]')) {
          //   row = rh.newRow({
          //     id: true
          //   })
          //   rh.insertAfter(row, c)
          // }
          if (e.keyCode === 13) {
            if (ctn.value === '') {
              e.preventDefault()
              return deleteTodo()
            }
            commands['todo'](rh, c)
            // row.removeAttribute('data-editor-row')
          } else if (e.keyCode === 8) {
            if (ctn.value === '') {
              e.preventDefault()
              deleteTodo()
            }
          }

          function deleteTodo() {
            // let row = c.parentNode.querySelector('[data-editor-row]')
            // let br = document.createElement('br')
            // row.appendChild(br)
            // const sibling = c.previousSibling ? c.previousSibling : c.parentNode
            // c.parentNode.removeChild(c)
            // rh.getSelection().collapse(row, 0)
            // row.removeAttribute('data-editor-row')
            let newRow = rh.newRow({br: true})
            c.parentNode.replaceChild(newRow, c)
            rh.getSelection().collapse(newRow, 1)
          }
        })
      c.init = true
    })
  },
  'fontStyle' (rh, arg) {
    commands['formatBlock'](rh, arg)
    // if (rh.range.collapsed) {
    //   commands['formatBlock'](rh, arg)
    // } else {
    //   console.log('else')
    //   let texts = rh.getAllTextNodesInRange()
    //   texts.forEach(text => {
    //     let node = text.parentNode
    //     let newTag = document.createElement(arg)
    //     newTag.appendChild(text)
    //     if (node.parentNode) {
    //       node.parentNode.replaceChild(newTag, node)
    //     }
    //   })
    // }
  },
  'underline' (rh, arg) {
    document.execCommand('underline', false, arg)
    // if (!rh.range.collapsed) {
    //   document.execCommand('underline', false, arg)
    // } else {
    //   let text = rh.range.commonAncestorContainer
    //   let node = text
    //   if (text.nodeType === Node.TEXT_NODE) {
    //     if (!text.parentNode.dataset || text.parentNode.dataset !== 'content') {
    //       node = text.parentNode
    //     }
    //   }
    //   console.log('find', rh.findSpecialAncestor(node, 'u'))
    //   if (rh.findSpecialAncestor(node, 'u')) {
    //     console.log(' in')
    //     let ctn = text.nodeValue || text.innerText
    //     // at the end of u
    //     if (rh.getSelection().focusOffset === ctn.length) {
    //       let span = document.createElement('span')
    //       span.innerHTML = '&#8203;'
    //       rh.insertAfter(span, node)
    //       rh.getSelection().collapse(span, 1)
    //       return
    //     } else {
    //       if (ctn.replace(/\u200B/g, '') === '') {
    //         node.parentNode.removeChild(node)
    //         return
    //       }
    //       console.log('middle')
    //       return
    //     }
    //   }
    //   let newUnderline = document.createElement('u')
    //   newUnderline.innerHTML = '&#8203;'
    //   if (text.parentNode) {
    //     rh.insertAfter(newUnderline, text)
    //     rh.getSelection().collapse(newUnderline, 1)
    //   }
    // }
  },
  'delete' (rh, e) {
    console.log('delete')
    // restore first row
    let node = rh.range.commonAncestorContainer
    node = rh.findSpecialAncestor(node, 'p')
    if (!node) return
    if (rh.range.collapsed && (rh.range.startOffset === 0 || (node.innerHTML.replace(/<br>/g, '') === '' && rh.range.startOffset === 1))) {
      if (node) {
        let firstRow = rh.editZone().firstElementChild
        if (firstRow === node) {
          e.preventDefault()
        } else if (firstRow.contains(node)) {
          e.preventDefault()
          let newRow = rh.newRow({br: true, tag: 'p'})
          firstRow.parentNode.replaceChild(newRow, firstRow)
          rh.getSelection().collapse(newRow, 1)
        }
      }
    }

    if (node.innerHTML.replace(/<br>/g, '') === '') {
      // get previous row with content
      let preRow
      let rows = Array.from(node.parentNode.querySelectorAll('p'))
      let rowIndex = null
      rows.forEach((row, index) => {
        if (row === node) {
          rowIndex = index
        }
        if (rowIndex === null) {
          if (row.innerHTML.replace(/<br>/g, '') !== '') {
            preRow = row
          }
        }
      })
      // cursor focus on previous row's input if previous row is todo
      if (preRow && preRow.dataset && preRow.dataset.editorTodo) {
        e.preventDefault()
        let input = preRow.querySelector('input[type="text"]')
        if (input) {
          input.focus()
        }
      }
    }
  },
  'keydown' (rh, e) {
    // maintain row
    if (rh.range.collapsed) {
      let node = rh.range.commonAncestorContainer
      // if (node.nodeType === Node.TEXT_NODE && )
    }
    console.log('rh', rh.range)
  }
}
commands.insertImage = insertImage

export default commands
