const ociRegion = "us-ashburn-1"
const configs = require('../oci-api-requestor/oci-configuration').configs;

describe('Tweet Retriever unit-test', () => {

    let secretRetriever
    let Twit
    let tweetRetriever
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

        // mock the modules that Tweet Retriever depends on
        // see https://stackoverflow.com/questions/48214206/how-to-mock-method-of-instance-of-module-with-jest for details on the order of mocking and requiring
        jest.mock('twit');
        jest.mock('../oci-secret-retriever/oci-secret-retriever')
        secretRetriever = require('../oci-secret-retriever/oci-secret-retriever.js')
        Twit = require('twit')
        tweetRetriever = require('./tweet-retriever.js');
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });


    const hashtag = "Trump"
    const minutes = 60
    const twitterClientCredentialsSecretOCID = "ocid1.vaultsecret.oc1.iad.amaaaaaa6sde7caapotgnzrzq6lehyeeef3wprzwcyejk3gvh6prqxvicqxa"


    test(`Test that result is of type Array`, async () => {

        process.env.TWITTER_CREDENTIALS_SECRET_OCID = twitterClientCredentialsSecretOCID
        const tweetsRetrieved = await tweetRetriever.retrieveTweets(hashtag, minutes)
        // how to verify if a function on an object has been called? a special function was added to the Mock object to return the global count of function calls
        // note: the Twit object inspected here is not the same as the object used in the tweet-retriever module
        expect(new Twit({}).getCallCount()).toBe(1)
        expect(secretRetriever.retrieveSecret).toHaveBeenCalled();

        expect(tweetsRetrieved).toBeInstanceOf(Array)

    }, 20000)
    test(`Test that result is produced from local twitter credentials file`, async () => {
        // mock the modules that Tweet Retriever depends on

        process.env.TWITTER_CREDENTIALS_FILE = `${__dirname}/../tweet-retriever/twitter-client-credentials.js`
        const tweetsRetrieved = await tweetRetriever.retrieveTweets(hashtag, minutes)
        expect(tweetsRetrieved).toBeInstanceOf(Array)

    }, 20000)
    test(`Test that negative number of minutes is not allowed`, async () => {
        const minutes = -10
        expect.hasAssertions();
        // testing for exceptions thrown in asynchronous functions: https://www.valentinog.com/blog/throw-async/
        await expect(tweetRetriever.retrieveTweets(hashtag, minutes)).rejects.toThrowError()
    })
    test(`Test that the number of minutes is not allowed to surpass 7 days`, async () => {
        const minutes = 7 * 24 * 60 + 5
        expect.hasAssertions();
        await expect(tweetRetriever.retrieveTweets(hashtag, minutes)).rejects.toThrowError()
    })
})