/*
 * inspect whether the cursor is in such modules
 **/

export default {
  todo (node) {
    return node.getAttribute('data-editor-todo') || node.parentNode.getAttribute('data-editor-todo')
  },
  quote (node) {
    return node.getAttribute('data-editor-quote') || node.parentNode.getAttribute('data-editor-quote')
  }
}
