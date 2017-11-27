// const fontSizeMap = {
//   3: 'medium',
//   4: 'large',
//   5: 'x-large',
//   6: 'xx-large'
// }


export default function (rh, arg) {
  // commont part is through fontSize

  // if (rh.range.collapsed) {
  //   let node = rh.range.commonAncestorContainer
  //   let row = rh.getRow(node)
  //   if (row) {
  //     let allOffspring = Array.from(row.querySelectorAll('*'))
  //     allOffspring.forEach(node => {
  //       node.style.fontSize = ''
  //     })
  //     row.style.fontSize = fontSizeMap[arg]
  //   }
  // } else {
  //   document.execCommand('styleWithCSS', false)
  //   document.execCommand('fontSize', false, arg)
  //   document.execCommand('styleWithCSS', true)
  // }

  // through font tag
  if (rh.range.collapsed) {
    let node = rh.range.commonAncestorContainer
    let row = rh.getRow(node)
    if (row) {
      rh.setRangeAt(row, true)
      document.execCommand('styleWithCSS', false, false)
      document.execCommand('fontSize', false, arg)
      rh.editor.restoreSelection()
    }
  } else {
    document.execCommand('styleWithCSS', false, false)
    document.execCommand('fontSize', false, arg)
  }
}
