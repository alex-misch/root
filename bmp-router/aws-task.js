#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require( 'path' );
const s3 = new AWS.S3();

const myBucket = 'io-boomfunc-bmp';

const readFile = (filename, callback) => {
  fs.readFile(filename, (err, buffer) => {
    if (!err) {
      callback(buffer);
    }
    else {
      console.error(err);
      process.exit(1);
    }
  });
};

const getFileList = (dir, filelist) => {
  let files = fs.readdirSync(dir)
  filelist = filelist || []

  files.forEach( file => {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = getFileList(dir + '/' + file, filelist)
    } else {
      filelist.push(dir + '/' + file)
    }
  })
  return filelist
}

const dist = './dist'
const project = require( path.resolve( './package.json')  )

getFileList( `${dist}` ).forEach( filePath => {

  readFile( filePath , buffer => {
    var filePathAbs = filePath.replace( dist+'/', '' )
    let realPath = `${project.name}/${project.version}/${filePathAbs}`
    console.log('\x1b[33mUploading ', realPath, '...' )

    let params = {
      Bucket: myBucket,
      Key: realPath,
      Body: buffer,
      ACL: "public-read",
			CacheControl: 'no-cache,must-revalidate',
      ContentType: filePath.indexOf( '.css' ) >= 0 ? 'text/css' : 'text/plain'
      // ,Metadata: {
      //   "Access-Control-Allow-Origin": "*",
      //   "Access-Control-Allow-Methods": "GET, HEAD",
      //   "Access-Control-Allow-Credentials": 'false',
      // }
    };
    let options = { partSize: 10 * 1024 * 1024, queueSize: 1 };
    s3.upload(params, options, (err, data) => {
      if (!err)
        console.log( 'Success upload ', filePath, 'to', data );
      else {
        console.error( '\x1b[31mUPLOAD ERROR: ' )
        console.error( '\x1b[37mMessage: ', err.message )
        console.error( 'Origin:  ', err.originalError.message )
        process.exit(1)
      }
    });

  });

});
