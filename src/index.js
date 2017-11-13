import polyfill from './util/polyfill-ie'
import buildInModules from './modules/index'
import editor from './editor/editor'
import i18nZhCn from './i18n/zh-cn'
import i18nEnUs from './i18n/en-us'
import {
  mixin,
  isObj
} from './util'

polyfill()

class Editor {

  constructor(options = {}) {
    let modules = [...buildInModules]
    let reservedNames = {}
    modules.forEach(m => {
      if (m.name) {
        reservedNames[m.name] = true
      }
    })
    const components = {}
    const config = {}

    // extended modules
    if (Array.isArray(options.extendModules)) {
      options.extendModules.forEach(module => {
        if (module.name && !reservedNames[module.name]) {
          modules.push(module)
        } else {
          throw new Error('extended module must have a name and should not be the same as buildIn module')
        }
      })
    }

    // modules in use
    if (Array.isArray(options.modules)) {
      let m = []
      options.modules.forEach(name => {
        if (typeof name !== 'string') {
          throw new Error('modules\'s item must be a string')
        }
        modules.forEach(module => {
          if (module.name === name) {
            m.push(module)
          }
        })
      })
      modules = m
    }

    modules.forEach(module => {
      // config
      let curConfig = options[module.name]
      let moduleConfig = module.config
      if (isObj(curConfig) || isObj(moduleConfig)) {
        Object.assign(moduleConfig, curConfig)
        config[module.name] = moduleConfig
      }

      if (module.dashboard) {
        module.dashboard.module = module
        components[`dashboard-${module.name}`] = module.dashboard
      }
      module.styleInspectResult = null
      module.forbidden = null
      if (module.tab) {
        module.tab.module = module
        module.tabName = `tab-${module.name}`
        components[module.tabName] = module.tab
      }
      if (options.icons && options.icons[module.name]) {
        module.icon = options.icons[module.name]
      }
      if (module.config && module.config.handler) {
        module.handler = module.handler || module.config.handler
      }

      module.hasDashboard = !!module.dashboard
      module.hasTab = !!module.tab
      // prevent vue sync
      delete module.dashboard
      delete module.tab
    })

    // i18n
    const i18n = {'zh-cn': i18nZhCn, 'en-us': i18nEnUs}
    const customI18n = options.i18n || {}
    Object.keys(customI18n).forEach((key) => {
      i18n[key] = i18n[key] ? Object.assign(i18n[key], customI18n[key]) : customI18n[key]
    })
    const language = options.language || 'en-us'
    const locale = i18n[language]

    // shortcut
    const shortcut = options.shortcut

    // commands
    const commands = options.commands

    const compo = mixin(editor, {
      data () {
        return {modules, locale, shortcut, commands, config}
      },
      components
    })
    Object.assign(this, compo)
  }

  /**
   * global install
   * @param Vue
   * @param options
   */
  static install(Vue, options = {}) {
    Vue.component(options.name || 'my-vue-editor', new Editor(options))
  }
}

export default Editor
