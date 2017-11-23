import constant from '../constant-config'
const methods = {
  /*
   * func create a new row element
   * @param {obj} data
   *          tag {str} default: 'div'
   *          contenteditable {boolean} default: true
   *          id {boolean} whether need a id default: false
   *          br {boolean} whether need a br element after current row element default: false
   * @return  {node}
   **/
  newRow (data = {}) {
    const row = document.createElement(data.tag || constant.ROW_TAG)
    if (data.id) {
      row.dataset.editorRow = methods.createRandomId('row')
    }
    if (data.br) {
      const br = document.createElement('br')
      row.appendChild(br)
    }
    if (data.contenteditable !== false) {
      row.setAttribute('contenteditable', true)
    }
    return row
  },
  // get selection
  getSelection () {
    return window.getSelection ? window.getSelection() : document.getSelection()
  },
  /*
   * func insert a element after target element
   * @param newElement {node}
   * @param targetElement {node}
   **/
  insertAfter (newElement, targetElement) {
    var parent = targetElement.parentNode
    if (parent.lastChild === targetElement) {
      parent.appendChild(newElement)
    } else {
      parent.insertBefore(newElement, targetElement.nextSibling)
    }
  },
  /*
   * func create a random id
   * @param preffix {str} id's preffix
   * @return id
   **/
  createRandomId (preffix) {
    return `${preffix || 'id'}-${Math.random() * 1000 + new Date().getTime()}`
  },
  /*
   * return edit zone element
   **/
  editZone () {
    if (methods.editZone_cache) {
      return methods.editZone_cache
    }
    methods.editZone_cache = document.querySelector('[data-editor="content"]')
    return methods.editZone_cache
  }
}

export default methods
