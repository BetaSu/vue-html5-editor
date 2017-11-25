export default {
  name: 'linethrough',
  icon: 'iui-icon iui-icon-linethrough',
  handler: function (rh) {
    rh.editor.execCommand('strikeThrough')
  }
}
