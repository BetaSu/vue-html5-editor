export default {
  name: 'bold',
  icon: 'iui-icon iui-icon-bold',
  show: true,
  handler: function (editor) {
    editor.execCommand('bold')
  }
}
