export default {
  name: 'quote',
  icon: 'iui-icon iui-icon-quote',
  show: true,
  type: 'block',
  exclude: ['todo', 'ul'],
  mounted (editor) {
    editor.execCommand('initQuote')
  },
  handler: function (editor, module) {
    let isInQuote = editor.activeModules.includes(module.name)
    editor.execCommand('quote', isInQuote)
  }
}
