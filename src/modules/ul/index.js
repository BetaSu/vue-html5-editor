export default {
  name: 'ul',
  icon: 'iui-icon iui-icon-list',
  show: true,
  handler: function (rh) {
    rh.editor.execCommand('insertUnorderedList')
  }
}
