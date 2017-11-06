import {
  mergeArray,
  getDescendantTextNodes,
  getAfterStartDescendantTextNodes,
  getBeforeEndDescendantTextNodes,
  getParentBlockNode,
  isInlineElement,
  getAllSpecifyNode,
  getNodeNum,
  howManyNestAncestorSameTag
} from '../range/util'
import { createRandomId } from '../util'

/*
 * desc 请在这里选择需要用到的指令 或者定义新的指令
 **/

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
          && isInlineElement(textNode.parentNode)) {
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
            && isInlineElement(textNode.parentNode)) {
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
            && isInlineElement(textNode.parentNode)) {
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
        && isInlineElement(textNode.parentNode)) {
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
      const parentBlock = getParentBlockNode(textNode)
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
  // 废弃
  'indentv2' (rh, arg) {
    const range = rh.range
    // 单行的情况
    if (range.startContainer === range.endContainer) {
      let text = getDescendantTextNodes(range.startContainer)[0]
      if (!arg && text && text.nodeValue.length === range.startOffset && range.startOffset === range.endOffset) {
        return
      }
      if (!text) {
        return
      }
      const fragment = document.createElement('span')
      fragment.style.display = 'inline-block'
      fragment.setAttribute('contenteditable', false)
      fragment.setAttribute('data-editor', 'indent-block')
      fragment.className = 'indent-block'
      fragment.innerHTML = '&nbsp;'
      // arg 为true时 在该行最左侧插入缩进
      if (arg) {
        fragment.style.float = 'left'
        const parent = getParentBlockNode(range.startContainer)
        if (parent) {
          if (parent.dataset.editor === 'content') {
            if (parent.childNodes && parent.childNodes[0]) {
              parent.insertBefore(fragment, parent.childNodes[0])
              return
            } else {
              parent.appendChild(fragment)
              return
            }
          }
          // 针对列表 在列表li内部插入indent
          if (parent.nodeName === 'LI') {
            parent.insertBefore(fragment, parent.childNodes[0])
            return
          }
          parent.parentNode.insertBefore(fragment, parent)
          return
        }
      }
      range.insertNode(fragment)
      range.setStartAfter(fragment)
    }
    return
  },
  // 废弃
  'outdentv2' (rh, arg) {
    const range = rh.range
    // 单行的情况
    if (range.startContainer === range.endContainer) {
      const parent = getParentBlockNode(range.startContainer)
      const indentBlocks = getAllSpecifyNode(parent, {
        tagName: 'span',
        'data-editor': 'indent-block'
      })
      if (!indentBlocks.length) return
      indentBlocks[0].parentNode.removeChild(indentBlocks[0])
    }
  },
  // unorderedList's insert and indent logic
  'listIndent' (rh, arg) {
    const range = rh.range
    const startContainer = range.startContainer
    const parent = getParentBlockNode(startContainer)
    if (parent.dataset && parent.dataset.editor === 'content') {
      document.execCommand('insertUnorderedList', false, arg)
      return
    } else {
      if (parent.nodeName === 'LI') {
        const pre = parent.previousSibling
        if (pre && pre.nodeName === 'LI') {
          return document.execCommand('indent', false)
        }
        return document.execCommand('insertUnorderedList', false, arg)
      }
      if (parent.nodeName === 'UL') {
        console.log('parent is ul', parent)
      }
    }
    document.execCommand('indent', false)
  },
  // treat normal indent and list indent differently
  'smartIndent' (rh, arg) {
    let startContainer = rh.range.startContainer
    const parent = getParentBlockNode(startContainer)
    if (parent.nodeName === 'UL' || parent.nodeName === 'LI') {
      commands['listIndent'](rh, arg)
    } else {
      if (startContainer.nodeType === 3) {
        startContainer = parent
      }
      const ulNum = getNodeNum(startContainer, 'ul')
      let pre_listNum = startContainer.getAttribute('data-editor-ulNum')
      if (pre_listNum && Number(pre_listNum) < ulNum) {
        return commands['listIndent'](rh, arg)
      }
      startContainer.setAttribute('data-editor-ulNum', ulNum)
      document.execCommand('indent', false, arg)
    }
  },
  'quote' (rh, arg) {
    const texts = rh.getAllTextNodesInRange()
    let container = document.createElement('div')
    let br = document.createElement('br')
    let quoteBlock = document.createElement(arg)
    texts.forEach(text => {
      const p = document.createElement('div')
      p.appendChild(text)
      quoteBlock.appendChild(p)
    })
    container.appendChild(quoteBlock)
    container.appendChild(br)
    commands['insertHTML'](rh, container.innerHTML)
  },
  'todo' (rh, arg) {
    let todoId = createRandomId('todo')
    let rowId = createRandomId('row')
    commands['insertHTML'](rh, `<div><p data-editor-todo=${todoId} contenteditable="false"><input type="checkbox"/><input type="text" placeholder="待办事项"></p><br></div><div data-editor-row="${rowId}"></div>`)
    document.querySelector(`[data-editor-todo='${todoId}'] input[type=text]`).focus()
    initCheckbox('[data-editor-todo]')
    function initCheckbox (selector) {
      const checkboxs = document.querySelectorAll(selector)
      checkboxs.forEach((c, index) => {
        const btn = c.querySelector('[type=checkbox]')
        const ctn = c.querySelector('[type=text]')
        btn.onclick = btn.onclick || (e => {
            if (btn.checked) {
              ctn.style.textDecoration = 'line-through'
            } else {
              ctn.style.textDecoration = 'none'
            }
          })
        ctn.onkeydown = ctn.onkeydown || (e => {
            if (e.keyCode === 13) {
              let row = document.querySelector(`[data-editor-row='${rowId}']`)
              const selection = window.getSelection ? window.getSelection() : document.getSelection()
              selection.collapse(row, 0)
              commands['todo'](rh, arg)
              row.removeAttribute('data-editor-row')
            }
            if (e.keyCode === 8 && ctn.value === '') {
              c.parentNode.removeChild(c)
            }
        })
      })
    }
  }
}

export default commands
