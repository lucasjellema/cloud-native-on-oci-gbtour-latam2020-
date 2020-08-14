const ociRegion = "us-ashburn-1"
const configs = require('../oci-api-requestor/oci-configuration').configs;

// oci nosql table create --compartment-id ocid1.compartment.oc1..aaaaaaaa5q2srleka3ll2xgpcdj3uns3nshzc3lbn2wgx2kcuah5blh47icq  --name TWEETS_TABLE --ddl-statement "CREATE TABLE IF NOT EXISTS TWEETS_TABLE (id LONG, text STRING, author STRING,tweet_timestamp TIMESTAMP(0), language STRING, hashtags STRING, PRIMARY KEY(SHARD(id)))" --table-limits="{\"maxReadUnits\": 60,  \"maxStorageInGBs\": 1,  \"maxWriteUnits\": 15 }" 

// oci nosql query execute --compartment-id ocid1.compartment.oc1..aaaaaaaa5q2srleka3ll2xgpcdj3uns3nshzc3lbn2wgx2kcuah5blh47icq --statement="INSERT INTO TWEETS_TABLE  (id, text,author, tweet_timestamp, language, hashtags)  VALUES (2,\"My Cool Tweet #cool\",\"Lucas\", CAST(\"2020-06-24T14:58:05\" AS TIMESTAMP), \"en\",\"#cool #aioug\")"

// oci nosql query execute --compartment-id ocid1.compartment.oc1..aaaaaaaa5q2srleka3ll2xgpcdj3uns3nshzc3lbn2wgx2kcuah5blh47icq --statement="DELETE FROM TWEETS_TABLE"
describe('Tweet Persister', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules() // clears the cache
        process.env = { ...OLD_ENV }; // sets the original set of environment variable values

        process.env['PRIVATE_KEY_FILE'] = `${__dirname}/../oci-api-requestor/oci_api_key.pem`
        process.env.KEY_FINGERPRINT = configs.keyFingerprint
        process.env.TENANCY_ID = configs.tenancyId
        process.env.USER_ID = configs.authUserId
        process.env.REGION = ociRegion
        process.env.COMPARTMENT_OCID = configs.compartmentId
        process.env.OCI_NAMESPACE = configs.namespaceName
        process.env.TABLE_OCID = "ocid1.nosqltable.oc1.iad.amaaaaaa6sde7caa5pkd3yrfwfkigw4n7iwyn2avng4wbdi6nyw7cxnqm7fq"
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });

    const tweetPersister = require('./tweet-persister.js');

    test(`Test that tweet is apparently persisted`, async () => {
        const tweets = [{"id":1214, "text":"Dummy Tweet2", "author":"The Real Daisy", "language":"English", "hashtags":"#browns "}
    ,{"id":1216, "text":"another Tweet", "author":"My Tweetress", "language":"English", "hashtags":"#no #tags "}]
        const tweetPersistenceReport = await tweetPersister.persistTweets({"tweets":tweets})
        expect(tweetPersistenceReport.size).toBe(tweets.size)
        

    })
    test(`Test that TABLE_OCID is mandatory environment variable`, async () => {
        process.env.TABLE_OCID = null
        expect.hasAssertions();
        // testing for exceptions thrown in asynchronous functions: https://www.valentinog.com/blog/throw-async/
        await expect(tweetPersister.persistTweets(null, null)).rejects.toThrowError()
    })

})