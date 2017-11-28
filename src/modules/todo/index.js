export default {
  name: 'todo',
  icon: 'iui-icon iui-icon-checked-line',
  show: true,
  type: 'block',
  exclude: 'ALL_BUT_MYSELF',
  mounted (editor) {
    editor.execCommand('initTodo')
  },
  handler (rh) {
    rh.editor.execCommand('todo', {
      insertAfter: rh.range.commonAncestorContainer,
      placeholder: '待办事项'
    })
  },
  inspect (add) {
    add('attribute', {
      'data-editor-todo': ''
    })
  }
}
