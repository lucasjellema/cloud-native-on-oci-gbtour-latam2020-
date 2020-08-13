const ociRegion = "us-ashburn-1"
const configs = require('../oci-api-requestor/oci-configuration').configs;

describe('OCI NoSQL Database Persister', () => {
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

    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });

    const databasePersister = require('./oci-nosql-database-persister.js');

    test(`Test of databasePersister `, async () => {
        const record = {"id":42,"name":"Lex", "country":"The Netherlands"}
        const result = await databasePersister.persistRecord("ocid1.nosqltable.oc1.iad.amaaaaaa6sde7caapdffqwkjdqp3vg672hcacooenboqqhbes6zqasz5hdfa", record) // labTable1
        expect(result).toBeDefined()
    })

    test(`Test of databasePersister on table TWEETS_TABLE `, async () => {
        process.env.TABLE_OCID = "ocid1.nosqltable.oc1.iad.amaaaaaa6sde7caa5pkd3yrfwfkigw4n7iwyn2avng4wbdi6nyw7cxnqm7fq" // TWEET_TABLE
        const record = {"id":new Date().getTime(), "text":"Dummy Tweet", "author":"The Real Daisy", "language":"English", "hashtags":"#browns "}
        const result = await databasePersister.persistRecord(process.env.TABLE_OCID, record)
        expect(result).toBeDefined()
    })

    test(`Test of databasePersister `, async () => {
        const record = {"id":42,"name":"Lex", "country":"The Netherlands"}
        const result = await databasePersister.persistRecord("ocid1.nosqltable.oc1.iad.amaaaaaa6sde7caa5pkd3yrfwfkigw4n7iwyn2avng4wbdi6nyw7cxnqm7fq", record)
        expect(result).toBeDefined()
    })
})