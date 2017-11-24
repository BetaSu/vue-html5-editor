export default {
  name: 'underline',
  icon: 'iui-icon iui-icon-underline',
  show: true,
  handler: function (editor, module) {
    if (module.styleInspectResult) {
      module.styleInspectResult = false
    }
    editor.execCommand('underline')
  }
}
