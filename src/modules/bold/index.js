export default {
  name: 'bold',
  icon: 'iui-icon iui-icon-bold',
  show: true,
  handler: function (rh) {
    rh.editor.execCommand('bold')
  }
}
