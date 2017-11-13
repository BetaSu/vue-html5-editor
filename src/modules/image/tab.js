import lrz from 'lrz'
import template from './tab.html'

export default {
  template,
  data() {
    return {
      name: 'tab-image'
    }
  },
  methods: {
    pick() {
      if (this.$refs.item.classList.contains('forbidden')) return
      this.$refs.file.click()
    },
    process() {
      const file = this.$refs.file.files[0]
      this.$parent.execCommand('insertImage', file)
    }
  }
}
