import tab from './tab'

export default {
  name: 'image',
  i18n: 'image',
  type: 'block',
  canUploadSameImage: true,
  imgOccupyNewRow: false,
  maxSize: 512 * 1024,
  compress: {

    // max width
    width: 1600,

    // max height
    height: 1600,

    // cpmpress quality 0 - 1
    quality: 0.8
  },
  tab,
  inspect (add) {
    add('tag', 'img')
  }
}
