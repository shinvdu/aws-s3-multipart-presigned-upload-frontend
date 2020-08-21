import React, { Component } from 'react'
import axios from 'axios'

export default class Index extends Component {
	constructor(props) {
		super(props)
    this.state = {
      selectedFile: null,
      uploadId: '',
      fileName: '',
      bucket: 'cpt-bucket1',
      backendUrl: 'https://fyrbaaf4hc.execute-api.us-east-2.amazonaws.com/cpt/api/v1/file'
      // backendUrl: 'https://xdya8i9m4i.execute-api.us-east-2.amazonaws.com/cpt/api/v1/file'
      // backendUrl: 'http://localhost:4000/api/v1/file'
    }
	}

// ===============================================
// The fileChangedHandler obtains the file specified in the
// input field in the form.
// ===============================================

  async fileChangedHandler(event) {
    try {
      // console.log('Inside fileChangedHandler')
      let selectedFile = event.target.files[0]
      let fileName = selectedFile.name
      this.setState({ selectedFile })
      this.setState({ fileName })
    } catch (err) {
      console.error(err, err.message)
    }
  }

// ===============================================
// The startUpload function obtains an uploadId generated in the backend
// server by the AWS S3 SDK. This uploadId will be used subsequently for uploading
// the individual chunks of the selectedFile.
// ===============================================

  async startUpload(event) {
    try {
      // console.log('Inside startUpload')
      event.preventDefault()

      console.log(this.state.selectedFile.type + ' FileType')
      let resp = await axios.post(`${this.state.backendUrl}/start-upload`,{
          bucketName: this.state.bucket,
          filepath: this.state.fileName,
          // fileType: this.state.selectedFile.type
        }
      )

      let {uploadId} = resp.data
      this.setState({uploadId})

      this.uploadMultipartFile()
    } catch(err) {
      console.log(err)
    }
  }

// ===============================================
// The uploadMultipartFile function splits the selectedFile into chunks
// of 10MB and does the following:
// (1) call the backend server for a presigned url for each part,
// (2) uploads them, and
// (3) upon completion of all responses, sends a completeMultipartUpload call to the backend server.
//
// Note: the AWS SDK can only split one file into 10,000 separate uploads.
// This means that, each uploaded part being 10MB, each file has a max size of 
// 100GB.
// ===============================================

  async uploadMultipartFile() {
    try {
      console.log('Inside uploadMultipartFile')
      const FILE_CHUNK_SIZE = 7000000 // 7MB
      const fileSize = this.state.selectedFile.size
      const NUM_CHUNKS = Math.floor(fileSize / FILE_CHUNK_SIZE) + 1
      let promisesArray = []
      let start, end, blob

      for (let index = 1; index < NUM_CHUNKS + 1; index++) {
        start = (index - 1)*FILE_CHUNK_SIZE
        end = (index)*FILE_CHUNK_SIZE
        blob = (index < NUM_CHUNKS) ? this.state.selectedFile.slice(start, end) : this.state.selectedFile.slice(start)

        // (1) Generate presigned URL for each part
        let getUploadUrlResp = await axios.post(`${this.state.backendUrl}/get-upload-url`, {
            bucketName: this.state.bucket,
            filepath: this.state.fileName,
            partNumber: index,
            uploadId: this.state.uploadId
        })

        let { presignedUrl } = getUploadUrlResp.data
        console.log('   Presigned URL ' + index + ': ' + presignedUrl + ' filetype ' + this.state.selectedFile.type)

        // (2) Puts each file part into the storage server
        let uploadResp = axios.put(
          presignedUrl,
          blob,
          {}
        )
        // console.log('   Upload no ' + index + '; Etag: ' + uploadResp.headers.etag)
        promisesArray.push(uploadResp)
      }

      let resolvedArray = await Promise.all(promisesArray)
      console.log(resolvedArray, ' resolvedAr')

      let uploadPartsArray = []
      console.log(resolvedArray)

      resolvedArray.forEach((resolvedPromise, index) => {
        console.log(resolvedPromise.headers);
        uploadPartsArray.push({
          ETag: resolvedPromise.headers.etag,
          PartNumber: index + 1
        })
      })

      // (3) Calls the CompleteMultipartUpload endpoint in the backend server

      let completeUploadResp = await axios.post(`${this.state.backendUrl}/complete-upload`, {
          bucketName: this.state.bucket,
          filepath: this.state.fileName,
          parts: uploadPartsArray,
          uploadId: this.state.uploadId
      })

      console.log(completeUploadResp.data, ' Stuff')

    } catch(err) {
      console.log(err)
    }
  }

	render() {
		return (
      <div>
        <form onSubmit={this.startUpload.bind(this)}>
          <div>
            <p>Upload Dataset:</p>
            <input type='file' id='file' onChange={this.fileChangedHandler.bind(this)} />
            <button type='submit'>
              Upload
            </button>
          </div>
        </form>
      </div>
		)
	}
}