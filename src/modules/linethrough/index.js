export default {
  name: 'linethrough',
  icon: 'iui-icon iui-icon-linethrough',
  handler: function (editor) {
    editor.execCommand('strikeThrough')
  }
}
