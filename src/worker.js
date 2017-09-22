require('dotenv').config()

const kue = require('kue')
const axios = require('axios')
const sharp = require('sharp')

const query = require('./query')
const image = require('./image')
const queue = kue.createQueue()

queue.process('thumbnail', (job, done) => {
  const { id } = job.data
    // 이미지 항목 정보를 데이터베이스에서 가져온 후 (가상서비스의 디스크는 믿을게 못됨.)
  query.getImageEntryById(id)
    .then(imageEntry => {
      // 원본 이미지 다운로드
      axios.get(imageEntry.original_url, {
        responseType: 'arrayBuffer' // axios가 똑똑하지 않으니까 어레이버퍼를 사용. arraybuffer 와 buffer의 차이 알아둘 것.
      }).then(res => {
        // 썸네일 생성
        return sharp(res.data)
          .resize(200, 200)
          .crop(sharp.gravity.center)
        res.data
      }).then(buffer => {
        return image.uploadImageFile(buffer)
      }).then(location => {
        // 이미지 항목의 썸네일 URL 수정
        return query.updateThumbnailUrlByid(id, ocation)
      }).then(() => {
        done()
      }).catch(err => {
        done(err)
      })
    })
    // 썸네일 업로드
    // 이미지 항목의 썸네일 URL 수정 
})