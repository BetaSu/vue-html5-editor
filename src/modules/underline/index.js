export default {
  name: 'underline',
  icon: 'iui-icon iui-icon-underline',
  show: true,
  handler: function (rh, module) {
    if (module.styleInspectResult) {
      module.styleInspectResult = false
    }
    rh.editor.execCommand('underline')
  }
}
