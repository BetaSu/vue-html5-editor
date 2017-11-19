import RangeHandler from '../range-handler'
import './style.css'
import template from './editor.html'
import dragPic from './drag-pic'
import inspectForWrapper from './style-inspect-for-wrapper'
import inspectForBlock from './style-inspect-for-block'

export default {
  template,
  props: {
    content: {
      type: String,
      required: true,
      default: ''
    },
    height: {
      type: Number,
      default: 300,
      validator(val){
        return val >= 100
      }
    },
    zIndex: {
      type: Number,
      default: 1000
    },
    autoHeight: {
      type: Boolean,
      default: true
    }
  },
  directives: {
    dragPic
  },
  data(){
    return {
      modules: {},
      activeModules: [],
      fullScreen: false,
      dashboard: null
    }
  },
  watch: {
    content(val) {
      const content = this.$refs.content.innerHTML
      if (val !== content) {
        this.$refs.content.innerHTML = val
      }
    },
    fullScreen(val){
      const component = this
      if (val) {
        component.parentEl = component.$el.parentNode
        component.nextEl = component.$el.nextSibling
        document.body.appendChild(component.$el)
        return
      }
      if (component.nextEl) {
        component.parentEl.insertBefore(component.$el, component.nextEl)
        return
      }
      component.parentEl.appendChild(component.$el)
    }
  },
  computed: {
    contentStyle(){
      const style = {}
      if (this.fullScreen) {
        style.height = `${window.innerHeight - this.$refs.toolbar.clientHeight - 1}px`
        return style
      }
      if (!this.autoHeight) {
        style.height = `${this.height}px`
        return style
      }
      style['min-height'] = `${this.height}px`
      return style
    }
  },
  methods: {
    handleDragPic (file) {
      if ((this.config['image'] && this.config['image'].drag !== false) || !this.config['image']) {
        this.saveCurrentRange()
        this.execCommand('insertImage', file)
      }
    },
    toggleFullScreen(){
      this.fullScreen = !this.fullScreen
    },
    enableFullScreen(){
      this.fullScreen = true
    },
    exitFullScreen(){
      this.fullScreen = false
    },
    focus(){
      this.$refs.content.focus()
    },
    toggleDashboard(dashboard){
      this.dashboard = this.dashboard === dashboard ? null : dashboard
    },
    execCommand(command, arg){
      this.restoreSelection()
      if (this.range) {
        new RangeHandler(this.range, this).execCommand(command, arg)
      }
      this.toggleDashboard()
      this.$emit('change', this.$refs.content.innerHTML)
    },
    getCurrentRange(){
      return this.range
    },
    saveCurrentRange(){
      const selection = window.getSelection ? window.getSelection() : document.getSelection()
      if (!selection.rangeCount) {
        return
      }
      const content = this.$refs.content
      for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(0)
        let start = range.startContainer
        let end = range.endContainer
        // for IE11 : node.contains(textNode) always return false
        start = start.nodeType === Node.TEXT_NODE ? start.parentNode : start
        end = end.nodeType === Node.TEXT_NODE ? end.parentNode : end
        if (content.contains(start) && content.contains(end)) {
          this.range = range
          break
        }
      }
    },
    restoreSelection(){
      const selection = window.getSelection ? window.getSelection() : document.getSelection()
      selection.removeAllRanges()
      if (this.range) {
        selection.addRange(this.range)
      } else {
        const content = this.$refs.content
        const div = document.createElement('div')
        const range = document.createRange()
        content.appendChild(div)
        range.setStart(div, 0)
        range.setEnd(div, 0)
        selection.addRange(range)
        this.range = range
      }
    },
    activeModule(module){
      if (module.forbidden) return
      if (typeof module.handler === 'function') {
        module.handler(this, module)
        this.$nextTick(() => {
          this.saveCurrentRange()
          this.styleInspect()
          if (module.type !== 'block') {
            module.styleInspectResult = !module.styleInspectResult
          }
        })
        return
      }
      if (module.hasDashboard) {
        this.toggleDashboard(`dashboard-${module.name}`)
      }
    },
    styleInspect () {
      if (this.range) {
        this.activeModules = []
        let texts = new RangeHandler(this.range, this).getAllTextNodesInRange()
        let isBlockModule = false
        texts.forEach(text => {
          let node = text.parentNode
          Object.keys(inspectForBlock).forEach(moduleName => {
            if (inspectForBlock[moduleName](node)) {
              this.activeModules.push(moduleName)
              isBlockModule = true
            }
          })
          // current target is not a block type module
          if (!isBlockModule) {
            let wrapperInspectResult = inspectForWrapper(node)
            if (wrapperInspectResult.length) {
              this.activeModules.push(wrapperInspectResult)
            }
          }
        })
        if (texts.length === 0 && this.range.collapsed) {
          let node = this.range.commonAncestorContainer
          let isBlockModule = false
          Object.keys(inspectForBlock).forEach(moduleName => {
            if (inspectForBlock[moduleName](node)) {
              this.activeModules.push(moduleName)
              isBlockModule = true
            }
          })
          if (!isBlockModule) {
            let wrapperInspectResult = inspectForWrapper(node)
            if (wrapperInspectResult.length) {
              this.activeModules.push(wrapperInspectResult)
            }
          }
        }
        if (this.activeModules.length === 1) {
          let activeOne = this.activeModules[0]
          // is wrapper type module
          if (Array.isArray(activeOne)) {
            activeOne.forEach((key, index) => {
              this.$set(this.activeModules, index, key)
            })
          }
          // is block type module
          let activeModuleIsBlockModule = inspectForBlock[activeOne]
          this.modules.forEach(module => {
            // can not use a block module inside another block module
            if (activeModuleIsBlockModule) {
              if (module.type !== 'fn') {
                module.forbidden = true 
              }
            } else {
              module.forbidden = false
            }
            module.styleInspectResult = false
            if (this.activeModules.includes(module.name)) {
              module.styleInspectResult = true
            }
            if (Array.isArray(module.contains)) {
              this.activeModules.forEach(a => {
                if (module.contains.includes(a)) {
                  module.styleInspectResult = a
                }
              })
            }
          })
        } else {
          this.modules.forEach(module => {
            if (module.type !== 'fn') {
              module.forbidden = false
              module.styleInspectResult = false 
            }
          })
        }
      }
    }
  },
  created(){
    this.modules.forEach((module) => {
      if (typeof module.init === 'function') {
        module.init(this)
      }
    })
  },
  mounted(){
    const content = this.$refs.content
    const toolbar = this.$refs.toolbar
    content.innerHTML = this.content
    content.addEventListener('mouseup', () => {
      this.saveCurrentRange()
      this.styleInspect()
    }, false)
    toolbar.addEventListener('mouseup', this.saveCurrentRange, false)
    content.addEventListener('keyup', e => {
      this.$emit('change', content.innerHTML)
      this.saveCurrentRange()
      this.styleInspect()
    }, false)
    content.addEventListener('mouseout', (e) => {
      if (e.target === content) {
        this.saveCurrentRange()
      }
    }, false)
    this.touchHandler = (e) => {
      if (content.contains(e.target)) {
        this.saveCurrentRange()
      }
    }
    window.addEventListener('touchend', this.touchHandler, false)

    // handle shortcut
    content.addEventListener('keydown', e => {
      let item = this.shortcut[e.keyCode]
      if (item && item.length) {
        item.forEach(s => {
          if (e.keyCode === s.keyCode && e.altKey === !!s.altKey && e.ctrlKey === !!s.ctrlKey && e.metaKey === !!s.metaKey && e.shiftKey === !!s.shiftKey) {
            if (typeof s.handler === 'function') {
              e.preventDefault()
              this.saveCurrentRange()
              s.handler(this)
            }
          }
        })
      }
    }, false)

    this.$nextTick(() => {
      this.modules.forEach((module) => {
        if (typeof module.mounted === 'function') {
          module.mounted(this)
        }
      })
    })
  },
  updated(){
    // update dashboard style
    if (this.$refs.dashboard) {
      this.$refs.dashboard.style.maxHeight = `${this.$refs.content.clientHeight}px`
    }
  },
  beforeDestroy(){
    window.removeEventListener('touchend', this.touchHandler)
    this.modules.forEach((module) => {
      if (typeof module.destroyed === 'function') {
        module.destroyed(this)
      }
    })
  }
}
