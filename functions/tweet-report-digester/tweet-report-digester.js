const assert = require('assert');
const objectReader = require('./oci-object-reader/oci-object-reader.js');

const tweetStreamer = require('./tweet-streamer/tweet-streamer.js');
const tweetPersister = require('./tweet-persister/tweet-persister')

const digestTweetReport = async function (objectName, bucketName) {
    assert(objectName != null)
    const result = await objectReader.readObject(objectName, bucketName)
    const tweets = JSON.parse(result.response).tweets

    // two parallel activities: stream and nosql persist
    const streamResult = await tweetStreamer.publishTweetsOnStream({ "tweets": tweets })
    console.log(`StreamResult is in ${JSON.stringify(streamResult)}`)
    const tweetPersistenceReport = await tweetPersister.persistTweets({ "tweets": tweets })
    console.log(`PersistenceResult is in ${JSON.stringify(tweetPersistenceReport)}`)
    return {
        "request": { "filename": objectName, "numberOfTweets": tweets.size }
        , "result": { "streamPublicationResult": streamResult, "persistenceResult": tweetPersistenceReport }
    }
}

module.exports = {
    digestTweetReport: digestTweetReport
}