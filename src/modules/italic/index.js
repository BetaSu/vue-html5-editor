export default {
  name: 'italic',
  icon: 'iui-icon iui-icon-italic',
  handler: function (rh) {
    rh.editor.execCommand('italic')
  }
}
