/*
 * block means module which crate a new element in the position of cursor
 * like todo,quote,image...
 **/

export default {
  todo (node) {
    return node.getAttribute('data-editor-todo') || node.parentNode.getAttribute('data-editor-todo')
  },
  quote (node) {
    return node.getAttribute('data-editor-quote') || node.parentNode.getAttribute('data-editor-quote')
  }
}
