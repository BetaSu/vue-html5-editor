import tab from './tab'

export default {
  name: 'font',
  icon: 'iui-icon iui-icon-spanner',
  tab,
  inspect (add) {
    // through fontSize

    // add('style', {
    //   'fontSize': ['xx-large', 'x-large', 'large', 'medium']
    // })

    // through font tag
    add('tag', 'font').add('attribute', {
      'size': ['6', '5', '4']
    })
  }
}
