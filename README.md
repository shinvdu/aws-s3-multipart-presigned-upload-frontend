## Multipart + Presigned URL upload to AWS S3/Minio via the browser

### Motivation

I created this demo repo because documentation for multipart uploading of large files using presigned URLs was very scant.

I wanted to create a solution to allow users to upload files directly from the browser to AWS S3 (or any S3-compliant storage server). This worked great when I used AWS SDK's getSignedUrl API to generate a temporary URL that the browser could upload the file to. 

However, I hit a snag when dealing with files > 5GB because the pre-signed URL only allows for a maximum file size of 5GB to be uploaded at one go. As such, this repo demonstrates the use of multipart + presigned URLs to upload large files to an AWS S3-compliant storage service.

### Components used in this demo

* Frontend Server: React (Next.js)

### How to run

* Clone the repo and change directory into the repo
* Open three different terminal windows.

**Frontend Server**

In window 3, run:
```
cd frontend
npm install
npm run dev
```

**Upload File**

Go to `http://localhost:3000` in your browser window and upload a file.
