const fdk = require('@fnproject/fdk');
const tweetReportDigester = require('./tweet-report-digester')
const url = require('url');

// function can be invoked in several ways: 
// - triggered by cloud event (that contains property data.resourceName for the OCI resource that triggered the event - in this case an Object Storage file resour)
// - invoked thruogh HTTP POST request with a body that contains a property filename that refers to an object on Object Storage
// - invoked with HTTP GET request with a queryparameter called filename  that refers to an object on Object Storage (?filename=file-on-object-storage.json)
// The bucket and namespace on object storage from which the object is to be retrieved is set through environment variables : TWITTER_REPORTS_BUCKET and OCI_NAMESPACE
// Additionally, the NoSQL Database Table and the Stream to persist and publish to are set in environment variables STREAM_OCID and TABLE_OCID 
fdk.handle(async function (input, ctx) {
  const bucketName = process.env.TWITTER_REPORTS_BUCKET || "twitter-reports"
  let filename
  if (input.eventType ) { // cloud event 
    console.log(`Function tweet-report-digester was triggered by Cloud Event ${JSON.stringify(input)}`)
    
    console.log(`Filename ${input.data.resourceName}`)
    filename = input.data.resourceName
  } else {
    if (input.filename) {
      filename = input.filename
    }
    else {
      if (ctx.headers["Fn-Http-Request-Url"]) {
        const requestURL = ctx.headers["Fn-Http-Request-Url"][0]
        console.log(`tweetReportDigester invoked with Request URL ${JSON.stringify(requestURL)}`)
        const queryData = url.parse(requestURL, true).query;
        filename = queryData.filename
      }
    }
  }
  console.log(`Go process file ${filename}`)
  const x = await tweetReportDigester.digestTweetReport(filename, bucketName)

  x.url = ctx.headers["Fn-Http-Request-Url"]
  x.queryData = {}
  x.queryData.bucketName = bucketName
  x.queryData.filename = filename
  return x
})



// invoke with :
// echo -n '{"hashtag":"groundbreakers","minutes":5"}' | fn invoke gb-app tweet-consumer

// deploy with :
// fn deploy --app gb-app 