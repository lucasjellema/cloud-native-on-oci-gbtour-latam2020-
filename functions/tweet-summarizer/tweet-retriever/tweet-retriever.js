var assert = require('assert');
const Twit = require('twit')
const SEVEN_DAYS_IN_MINUTES = 7 * 24 * 60

const retrieveTweets = async function (hashtag, minutes = 5) {
    assert(minutes > 0)
    assert(minutes < SEVEN_DAYS_IN_MINUTES)  // the Twitter search api used in this module has a 7 day limit
    let tweetsRetrieved = []
    // get twitter credentials - from local file or from OCI Secret
    let twitterClientCredentials = await getTwitterCredentials()
    // invoke Twitter API
    tweetsRetrieved = await queryTweets(hashtag, minutes, twitterClientCredentials)
    return tweetsRetrieved
}

const getTwitterCredentials = async function () {
    // if env variable TWITTER_CREDENTIALS_SECRET_OCID is defined, then retrieve credentials from OCI Vault Secret
    if (process.env.TWITTER_CREDENTIALS_SECRET_OCID) {

        const secretRetriever = require('../oci-secret-retriever/oci-secret-retriever.js');
        const secretOCID = process.env.TWITTER_CREDENTIALS_SECRET_OCID
        const secretValue = await secretRetriever.retrieveSecret(secretOCID)
        const twitterCredentials = JSON.parse(secretValue.replace(/'/g, '"')) // secret is defined with single quotation marks, which is not processed correctly
        return twitterCredentials
    }
    // else read from file
    return require(process.env.TWITTER_CREDENTIALS_FILE).twitter_client_credentials
}

const NUMBER_OF_TWEETS_RETURNED = 100; //maximum number supported in search API is 100

const queryTweets = async (hashtag, howFarBack, twitterClientCredentials) => {
    return new Promise((resolve, reject) => {
        let today = new Date().toISOString()
        let fromDate = today.substr(0, 10) //yyyy-mm-dd
        const referenceTimestamp = new Date(new Date().getTime() - howFarBack * 60000)

        const referenceTimestampString = referenceTimestamp.toISOString()
        console.log(`Only tweets created after ${referenceTimestampString}`)
        const twitterClientAPIConstructorInput = {
            ...twitterClientCredentials, ...{

                timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
                strictSSL: true,     // optional - requires SSL certificates to be valid.
                // https://developer.twitter.com/en/apps/6008469
            }
        }
        T = new Twit(twitterClientAPIConstructorInput)
        T.get('search/tweets', { q: `#${hashtag} since:${fromDate}`, count: NUMBER_OF_TWEETS_RETURNED }, function (err, data, response) {
            if (err) return reject(err)
            const tweets = []
            for (let i = 0; i < data.statuses.length; i++) {
                // filter on and rewrite timestamp Sun Jun 21 19:37:43 +0000 2020
                let tweetCreatedAt = new Date(Date.parse(data.statuses[i].created_at));
                if (tweetCreatedAt.getTime() > referenceTimestamp.getTime()) {
                    // remove tweet if tweetCreatedAt < referenceTimestamp
                    data.statuses[i].creationTime = tweetCreatedAt.toISOString()
                    tweets.push({
                        "creationTime": tweetCreatedAt.toISOString()
                        , "author": data.statuses[i].user.name
                        , "tweetText": data.statuses[i].text
                        , "id": data.statuses[i].id_str
                        , "hashtags": data.statuses[i].entities.hashtags.reduce((tags, tag) => { return `${tags}#${tag.text} ` }, "")
                        , "lang": data.statuses[i].lang
                    })
                }
            }
            resolve(tweets)
        })
    })
}

module.exports = {
    retrieveTweets: retrieveTweets
}