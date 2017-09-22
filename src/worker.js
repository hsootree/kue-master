require('dotenv').config()

const kue = require('kue')
const axios = require('axios')
const sharp = require('sharp')

const query = require('./query')
const image = require('./image')
const queue = kue.createQueue()

queue.process('thumbnail', async(job, done) => {
  const { id } = job.data
  try {
    // 이미지 항목 정보를 데이터베이스에서 가져온 후 (가상서비스의 디스크는 믿을게 못됨.)
    const imageEntry = await query.getImageEntryById(id)
    const res = await axios.get(imageEntry.original_url, {
      responseType: 'arrayBuffer' // axios가 똑똑하지 않으니까 어레이버퍼를 사용. arraybuffer 와 buffer의 차이 알아둘 것.
    })
    const buffer = await sharp(res.data)
      .resize(200, 200)
      .crop(sharp.gravity.center)
      .toBuffer()
    const location = await image.uploadImageFile(buffer)
    await query.updateThumbnailUrlByid(id, location)
    done()
  } catch (err) {
    done(err)
  }
})