require('dotenv').config()

const kue = require('kue')
const axios = require('axios')
const sharp = require('sharp')

const query = require('./query')
const image = require('./image')
const queue = kue.createQueue()

queue.process('thumbnail', (job, done) => {
  const { id } = job.data
  query.getImageEntryById(id)
    .then(imageEntry => {
      return axios.get(imageEntry.original_url, {
        responseType: 'arraybuffer'
      }).then(res => {
        return sharp(res.data)
          .resize(200, 200)
          .crop(sharp.gravity.center)
          .toBuffer()
      }).then(buffer => {
        return image.uploadImageFile(buffer)
      }).then(location => {
        return query.updateThumbnailUrlByid(id, location)
      }).then(() => {
        console.log('done')
        done()
      }).catch(err => {
        done(err)
      })
    })
})