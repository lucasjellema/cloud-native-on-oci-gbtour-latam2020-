const fdk = require('@fnproject/fdk');
const tweetReportDigester = require('./tweet-report-digester')
const url = require('url');

console.log("load func.js")
fdk.handle(async function (input, ctx) {
  const bucketName = process.env.TWITTER_REPORTS_BUCKET || "twitter-reports"
  let filename
  if (input.eventType ) { // cloud event 
    console.log(`Cloud Event ${input.eventType}`)
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
        filename = queryData.filname
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