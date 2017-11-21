/*
 * style means module which add a style attribute in target element
 * like title, subtitle , main ......
 **/
// todo 待定的修改
let config = {
  'HEADING': {
    tag: 'p',
    fontSize: '30px',
    lineHeight: '1.4',
    name: '大标题'
  },
  'SUB_HEADING': {
    tag: 'p',
    fontSize: '24px',
    lineHeight: '1.4',
    name: '副标题'
  },
  'SMALL_HEADING': {
    tag: 'p',
    fontSize: '20px',
    lineHeight: '1.5',
    name: '小标题'
  },
  'MAIN': {
    tag: 'p',
    fontSize: '14px',
    lineHeight: '1.5',
    name: '正文'
  }
}

const styleNeedInspect = ['fontSize']

export default function (node) {
  let result = []
  while (node && ((node.dataset && node.dataset.editor !== 'content') || !node.dataset)) {
    styleNeedInspect.forEach(styleName => {
      if (!node.style) return
      let nodeStyle = node.style[styleName]
      Object.keys(config).forEach(moduleName => {
        if (config[moduleName][styleName] === nodeStyle) {
          result.push(moduleName)
        }
      })
    })
    node = node.parentNode
  }
  return result
}
