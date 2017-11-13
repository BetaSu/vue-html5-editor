import insertImage from './insertImage'

const commands = {
  fontSize (rh, arg) {
    // 重新实现，改为直接修改样式
    const textNodes = rh.getAllTextNodesInRange()
    if (!textNodes.length) {
      return
    }
    if (textNodes.length === 1 && textNodes[0] === rh.range.startContainer
      && textNodes[0] === rh.range.endContainer) {
      const textNode = textNodes[0]
      if (rh.range.startOffset === 0
        && rh.range.endOffset === textNode.textContent.length) {
        if (textNode.parentNode.childNodes.length === 1
          && rh.isInlineElement(textNode.parentNode)) {
          textNode.parentNode.style.fontSize = arg
          return
        }
        const span = document.createElement('span')
        span.style.fontSize = arg
        textNode.parentNode.insertBefore(span, textNode)
        span.appendChild(textNode)
        return
      }
      const span = document.createElement('span')
      span.innerText = textNode.textContent.substring(
        rh.range.startOffset, rh.range.endOffset)
      span.style.fontSize = arg
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
            textNode.parentNode.style.fontSize = arg
          } else {
            const span = document.createElement('span')
            span.style.fontSize = arg
            textNode.parentNode.insertBefore(span, textNode)
            span.appendChild(textNode)
          }
          return
        }
        const span = document.createElement('span')
        textNode.textContent = textNode.textContent.substring(
          0, rh.range.startOffset)
        span.style.fontSize = arg
        textNode.parentNode.insertBefore(span, textNode)
        rh.range.setStart(textNode, 0)
        return
      }
      if (textNode === rh.range.endContainer) {
        if (rh.range.endOffset === textNode.textContent.length) {
          if (textNode.parentNode.childNodes.length === 1
            && rh.isInlineElement(textNode.parentNode)) {
            textNode.parentNode.style.fontSize = arg
          } else {
            const span = document.createElement('span')
            span.style.fontSize = arg
            textNode.parentNode.insertBefore(span, textNode)
            span.appendChild(textNode)
          }
          return
        }
        const span = document.createElement('span')
        textNode.textContent = textNode.textContent.substring(rh.range.endOffset)
        span.style.fontSize = arg
        textNode.parentNode.insertBefore(span, textNode)
        span.appendChild(textNode)
        rh.range.setStart(textNode, textNode.textContent.length)
        return
      }
      if (textNode.parentNode.childNodes.length === 1
        && rh.isInlineElement(textNode.parentNode)) {
        textNode.parentNode.style.fontSize = arg
        return
      }

      const span = document.createElement('span')
      span.style.fontSize = arg
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
    if (parent.dataset && parent.dataset.editor === 'content') {
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
              pre.setAttribute('data-editor-siblingindentlevel', '10')
              document.execCommand('indent', false)
              break
            case '10':
              pre.setAttribute('data-editor-siblingindentlevel', '12')
              document.execCommand('insertUnorderedList', false, arg)
              break
            case '12':
              pre.setAttribute('data-editor-siblingindentlevel', '10')
              document.execCommand('indent', false)
              break
          }
          return
        }
        if (pre && pre.nodeName === 'UL') {
          return document.execCommand('indent', false)
        }
        return document.execCommand('insertUnorderedList', false, arg)
      }
      if (parent.nodeName === 'UL') {

      }
    }
    document.execCommand('indent', false)
  },
  // treat normal indent and list indent differently
  'smartIndent' (rh, arg) {
    let startContainer = rh.range.startContainer
    const parent = rh.getParentBlockNode(startContainer)
    if (parent.nodeName === 'UL' || parent.nodeName === 'LI') {
      commands['listIndent'](rh, arg)
    } else {
      if (startContainer.nodeType === 3) {
        startContainer = parent
      }
      const ulNum = rh.getNodeNum(startContainer, 'ul')
      let pre_listNum = startContainer.getAttribute('data-editor-ulNum')
      if (pre_listNum && Number(pre_listNum) < ulNum) {
        return commands['listIndent'](rh, arg)
      }
      startContainer.setAttribute('data-editor-ulNum', ulNum)
      document.execCommand('indent', false, arg)
    }
  },
  // only set contenteditable:false in parent node can child node trigger keydown listener
  'quote' (rh, arg) {
    const texts = rh.getAllTextNodesInRange()
    if (!texts.length) {
      texts.push(document.createTextNode(''))
    }
    let container = document.createElement('div')
    let br = document.createElement('br')
    let quoteBlock = document.createElement(arg)
    let id = rh.createRandomId('quote')
    quoteBlock.setAttribute('data-editor-quote', id)
    quoteBlock.setAttribute('contenteditable', 'false')
    texts.forEach(text => {
      const row = rh.newRow()
      row.appendChild(text)
      quoteBlock.appendChild(row)
    })
    container.appendChild(quoteBlock)
    container.appendChild(br)
    commands['insertHTML'](rh, container.innerHTML)
    const quote = document.querySelector(`[data-editor-quote='${id}']`)
    rh.getSelection().collapse(quote.firstElementChild, 0)


  },
  'initQuote' (rh, arg) {
    document.addEventListener('keydown', e => {
      if (e.target.dataset.editorQuote || e.target.parentNode.dataset.editorQuote) {
        if (e.keyCode === 13) {
          e.preventDefault()
          if (e.target.innerText.replace('\n', '') === '') {
            let parent = e.target.parentNode
            let sibling = parent.nextSibling
            if (!sibling) {
              sibling = rh.newRow({
                br: true
              })
              rh.insertAfter(sibling, parent)
            }
            parent.removeChild(e.target)
            rh.getSelection().collapse(sibling, 0)
          } else {
            const row = rh.newRow()
            rh.insertAfter(row, e.target)
            const sibling = e.target.nextSibling
            rh.getSelection().collapse(sibling, 0)
          }
        }
        if (e.keyCode === 8 && e.target.innerText.replace('\n', '') === '') {
          let quote = e.target.parentNode
          let sibling = e.target.previousSibling
          quote.removeChild(e.target)
          let num = quote.querySelectorAll('div')
          if (!num.length || (num.length === 1 && num[0].innerText === '')) {
            const row = rh.newRow()
            quote.parentNode.replaceChild(row, quote)
            rh.getSelection().collapse(row, 0)
          } else {
            rh.getSelection().collapse(sibling, 0)
          }
        }
      }
    })
  },
  'todo' (rh, afterWhich) {
    let row
    afterWhich = afterWhich || rh.range.commonAncestorContainer
    if (afterWhich) {
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
          if (child.getAttribute('data-editor-todo')) {
            targetIndex = index
          }
        }
      })
      targetIndex = targetIndex === undefined ? startIndex + 1 : targetIndex
      row = rh.newRow({
        br: true
      })
      afterWhich.parentNode.insertBefore(row, list[targetIndex])
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
          if (!row || !row.getAttribute('[data-editor-row]')) {
            row = rh.newRow({
              id: true
            })
            rh.insertAfter(row, c)
          }
          if (e.keyCode === 13) {
            if (ctn.value === '') {
              e.preventDefault()
              return deleteTodo()
            }
            commands['todo'](rh, c)
            row.removeAttribute('data-editor-row')
          } else if (e.keyCode === 8 && ctn.value === '') {
            e.preventDefault()
            deleteTodo()
          }

          function deleteTodo() {
            let row = c.parentNode.querySelector('[data-editor-row]')
            const sibling = c.previousSibling ? c.previousSibling : c.parentNode
            c.parentNode.removeChild(c)
            rh.getSelection().collapse(row, 0)
            row.removeAttribute('data-editor-row')
          }
        })
      c.init = true
    })
  }
}
commands.insertImage = insertImage

export default commands
