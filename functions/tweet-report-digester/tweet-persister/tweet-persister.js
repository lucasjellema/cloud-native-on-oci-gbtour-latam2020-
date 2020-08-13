const databasePersister = require('../oci-nosql-database-persister/oci-nosql-database-persister.js');
const assert = require('assert');

const persistTweets = async function (tweetsReport) {
    assert(process.env.TABLE_OCID != null)
    const persistenceReport = []
    for (let i = 0; i < tweetsReport.tweets.length; i++) {
        tweet = tweetsReport.tweets[i]
        let record =  {
            "id": tweet.id, "text": tweet.tweetText,
            "author": tweet.author, "tweet_timestamp": tweet.creationTime
            , "language": tweet.lang, "hashtags": tweet.hashtags
        }

      //  record = {"id":new Date().getTime(), "text":"Dummy Tweet", "author":"The Real Daisy", "language":"English", "hashtags":"#browns "}
        console.log(`tweet record ${tweet}`)
  console.log(`Tweet Record ${JSON.stringify(record)}`)
        const result = await databasePersister.persistRecord(process.env.TABLE_OCID, record)
        persistenceReport.push(JSON.stringify(result))
    } 
    return persistenceReport
}



module.exports = {
    persistTweets: persistTweets
}