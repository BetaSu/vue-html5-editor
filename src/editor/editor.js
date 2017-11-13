import RangeHandler from '../range-handler'
import './style.css'
import template from './editor.html'
import styleInspectMap from './style-inspect-map'
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
      if (module.type !== 'block') {
        module.styleInspectResult = !module.styleInspectResult
      }
      if (typeof module.handler === 'function') {
        module.handler(this, module)
        this.$nextTick(() => {
          this.saveCurrentRange()
          this.styleInspect()
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
        let blockInspectFinish = false
        texts.forEach(text => {
          let node = text.parentNode
          Object.keys(inspectForBlock).forEach(moduleName => {
            if (inspectForBlock[moduleName](node)) {
              this.activeModules.push(moduleName)
              blockInspectFinish = true
            }
          })
          if (!blockInspectFinish) {
            this.activeModules.push(styleInspectMap[node.nodeName] || 'normal')
          }
        })
        if (texts.length === 0 && this.range.collapsed) {
          Object.keys(inspectForBlock).forEach(moduleName => {
            if (inspectForBlock[moduleName](this.range.commonAncestorContainer)) {
              this.activeModules.push(moduleName)
            }
          })
        }
        if (this.activeModules.length === 1) {
          let activeModuleIsBlockModule = inspectForBlock[this.activeModules[0]]
          this.modules.forEach(module => {
            // can not use a block module inside another block module
            if (activeModuleIsBlockModule) {
              if (module.type === 'block') {
                module.forbidden = true
              }
            }
            module.styleInspectResult = false

            if (module.name === this.activeModules[0]) {
              module.styleInspectResult = true
              module.forbidden = false
            }
          })
        } else {
          this.modules.forEach(module => {
            module.forbidden = false
            module.styleInspectResult = false
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
      // if ([8, 13, 16, 18, 37, 38, 39, 40, 91].includes(e.keyCode)) {
      //   this.styleInspect()
      // }
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

    // handle shortcur
    if (this.shortcut !== false) {
      content.addEventListener('keydown', (e) => {
        if (e.keyCode === 9) {
          e.preventDefault()
          this.saveCurrentRange()
          if (e.shiftKey) {
            this.execCommand('outdent')
          } else {
            this.execCommand('smartIndent')
          }
        }
      }, false)
    }

    // handle drag drop
    if ((this.config['image'] && this.config['image'].drag !== false) || !this.config['image']) {
      content.addEventListener("dragstart", function (e) {
        console.log('dragstart', e)
      }, false);

      content.addEventListener("dragend", function (e) {
        console.log('dragend', e)
      }, false);

      /* 放下目标节点时触发事件 */
      content.addEventListener("dragover", function (e) {
        event.preventDefault()
        console.log('dragover', e)
      }, false);

      content.addEventListener("dragenter", function (e) {
        console.log('dragenter', e)

      }, false);

      content.addEventListener("dragleave", function (e) {
        // 当拖动元素离开可放置目标节点，重置其背景
        console.log('dragleave', dragleave)

      }, false);

      content.addEventListener("drop", function (e) {
        // 阻止默认动作（如打开一些元素的链接）
        event.preventDefault();
        console.log('drop', e)

      }, false);
    }
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
