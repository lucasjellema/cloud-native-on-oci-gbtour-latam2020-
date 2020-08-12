const assert = require('assert');
const tweetRetriever = require('./tweet-retriever/tweet-retriever.js');

const objectWriter = require('./oci-object-writer/oci-object-writer.js');

const SEVEN_DAYS_IN_MINUTES = 7 * 24 * 60

const aggregateTweets = async function (hashtag, minutes = 5) {
    assert(minutes > 0)
    assert(minutes < SEVEN_DAYS_IN_MINUTES)  // the Twitter search api used in this module has a 7 day limit
    let tweetsRetrieved = []
    tweetsRetrieved = await tweetRetriever.retrieveTweets(hashtag, minutes)

    // prettify the tweets?

    const objectName = `tweets-${hashtag}-${new Date().toISOString().substr(0, 19)}.json`  //yyyy-mm-ddThh:mi:ss
    const bucketName = "tweet-reports"

    // the padEnd is added because it seems bytes are getting lost when creating the file object; spaces are added that can get lost without affecting the JSON content 
    
    const objectWriterResponse = objectWriter.writeObject(JSON.stringify({"tweets": tweetsRetrieved})+" ".padEnd(550),objectName, bucketName)
   

    return {
        "request": { "hashtag": hashtag, "minutes": minutes },
        "result": { "numberOfTweets": tweetsRetrieved.length, "fileName": objectName }
    }
}

module.exports = {
    aggregateTweets: aggregateTweets
}