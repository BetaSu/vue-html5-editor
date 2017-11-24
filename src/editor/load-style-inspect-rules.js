/*
 * load rule keywords of style inspect
 **/

export default function (curModule, modules) {
  let moduleNameList = []
  let result = []
  modules.forEach(m => {
    if (m.name) {
      moduleNameList.push(m.name)
    }
  })
  moduleNameList = Array.from(new Set(moduleNameList))
  let exclude = curModule.exclude || []
  exclude.forEach(rule => {
    switch (rule) {
      // exclude all modules
      case 'ALL':
        result = moduleNameList
        break
      // exclude all modules but current module
      case 'ALL_BUT_MYSELF':
        result = moduleNameList
        result.splice(result.indexOf(curModule.name), 1)
        break
      default:
        result.push(rule)
        break
    }
  })
  return result
}
