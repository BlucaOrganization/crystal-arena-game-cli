const axios = require('axios')

const start = 16387

const end = 18391

const failed = []

const a = async () => {
  for (let i = start; i<=end; i++) {
    try {
      console.log('Get Public API for token id: ', i)
      await axios.get(`https://bluca-api.bluca.io/public/api/blucamon/${i}`)
    } catch (err) {
      console.log('token id : ', i, 'failed')
      failed.push(i)
    }
  }
  console.log(failed)
}

a()