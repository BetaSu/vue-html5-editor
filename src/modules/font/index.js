import tab from './tab'
import config from './config'

export default {
  name: 'font',
  icon: 'iui-icon iui-icon-spanner',
  tab,
  config,
  inspect (add) {
    // through fontSize

    // add('style', {
    //   'fontSize': ['xx-large', 'x-large', 'large', 'medium']
    // })

    // through font tag
    add('tag', 'font').add('attribute', {
      'size': Object.keys(config)
    })
  }
}
