export default {
  outdent: {
    keyCode: 9,
    shiftKey: true,
    handler (editor, e) {
      e.preventDefault()
      editor.execCommand('outdent')
    }
  },
  smartIndent: {
    keyCode: 9,
    handler (editor, e) {
      e.preventDefault()
      editor.execCommand('smartIndent')
    }
  },
  delete: {
    keyCode: 8,
    handler (editor, e) {
      editor.execCommand('delete', e, true)
    }
  }
}
