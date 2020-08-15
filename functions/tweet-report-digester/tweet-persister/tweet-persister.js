const databasePersister = require('../oci-nosql-database-persister/oci-nosql-database-persister.js');
const assert = require('assert');

const persistTweets = async function (tweetsReport) {
    assert(process.env.TABLE_OCID != null)
    const persistenceReport = []
    for (let i = 0; i < tweetsReport.tweets.length; i++) {
        tweet = tweetsReport.tweets[i]
        let record = {
            // certain characters in tweetText prevent signing from taking place correctly
            "id": parseInt(tweet.id), "text": tweet.tweetText,
            "author": tweet.author, "tweet_timestamp": tweet.creationTime
            , "language": tweet.lang, "hashtags": tweet.hashtags
        }

        //  record = {"id":parseInt(tweet.id), "text":"Replacement", "author":"The Real Daisy", "language":"English", "hashtags":"#browns "}

        let result = JSON.parse(await databasePersister.persistRecord(process.env.TABLE_OCID, record))
        if (result.code && "InvalidAuthorization" == result.code) {
            
            record.text = `encoded: ${asciiProofString(record.text)}`
            record.author = asciiProofString(record.author)
            record.hashtags = asciiProofString(record.hashtags)
            result = JSON.parse(await databasePersister.persistRecord(process.env.TABLE_OCID, record))
            if (result.code && "InvalidAuthorization" == result.code) {
                console.log(`problem with persisting tweet ${JSON.stringify(tweet)}; probably characters in the tweet text or author name that give problems in the signing of the HTTP request`)
            }
        }
        persistenceReport.push((result.code) ? { "code": result.code } : { "writeUnitsConsumed": result.writeUnitsConsumed })
    }
    return persistenceReport
}

const asciiProofString = function (text) {
    // source: https://bytefreaks.net/programming-2/javascript/javasript-remove-all-non-printable-and-all-non-ascii-characters-from-text
    printable_ASCII_only_string = text.replace(/[^ -~]+/g, " ");
    return printable_ASCII_only_string;
}

module.exports = {
    persistTweets: persistTweets
}