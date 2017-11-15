export default {
  outdent: {
    keyCode: 9,
    shiftKey: true,
    handler (editor) {
      editor.execCommand('outdent')
    }
  },
  smartIndent: {
    keyCode: 9,
    handler (editor) {
      editor.execCommand('smartIndent')
    }
  }
}
