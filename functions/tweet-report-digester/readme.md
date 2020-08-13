# Tweet Summarizer

this module reads tweets for a specified hashtag from Twitter over the last X minutes
and creates a JSON report with all tweets retrieved
and writes this report to OCI Object Storage


## technical notes
the module is to be wrapped in an Fn Function to be deployed on OCI Functions platform
when deployed as Function, the Function will benefit from a dynamic group policy on OCI to become Resource enabled (and get a generated private key and configuration file injected); when running stand alone, the module needs a stand alone OCI private key file and configuration file.

the module assumes it retrieves Twitter Client Credentials from an OCI Vault in the form of a secret. the module could also be allowed to use locally defined credentials.

            OCI Private Key & Config
             |  
             v
Fn func =>  Tweet Summarizer  =>  OCI Object Storage
             |           |
             v           v
             Twitter     OCI Vault

Note: environment details are not passed to the module as (functional) parameter, but instead through environment variables. Variables can be set for:
- vault & secret:secret ocid
- OCI authentication: OCI config & private key
- OCI Object Storage: bucket, namespace (, compartment?)      
 Environment Variables: COMPARTMENT_OCID, SECRET_OCID, REGION, NAMESPACE  

assumption:
Function through a Dynamic Group benefit from policy that allows the dynamic group 

## Dynamic Group and Policy 
Create dynamic group *functions-in-gb-compartment* that has all functions in compartment *gb-compartment* as member:

export TENANCY_OCID=ocid1.tenancy.oc1..aaaaaaaag7c7slwmlvsodyym662ixlsonnihko2igwpjwwe2egmlf3gg6okq
export compartmentId=ocid1.compartment.oc1..aaaaaaaaf2a5o5jblcapqarilphbl4v6lop3nc2nyyt3mfpwmsandebwhwoa
export REGION=us-ashburn-1
oci iam dynamic-group create --compartment-id $TENANCY_OCID --name "gb-tour-2020-latam-dynamic-group-functions" --description "to collect all functions in compartment gb-tour-2020-latam"  --matching-rule "[ \"ALL {resource.type = 'fnfunc', resource.compartment.id = '$compartmentId'}\"]" 

Create a policy that grants read access on secrets in the *gb-tour-2020-latam* to all functions in that compartment :

oci iam policy create  --name "read-secret-permissions-for-resource-principal-enabled-functions-in-lab-compartment" --compartment-id $compartmentId  --statements "[ \"allow dynamic-group gb-tour-2020-latam-dynamic-group-functions to read secret-family in compartment gb-tour-2020-latam\" ]" --description "to allow functions in gb-tour-2020-latam to read secrets"


Create a policy that grants write access on objects in Object Storage in the *gb-tour-2020-latam* to all functions in that compartment :
oci iam policy create  --name "write-object-permissions-for-resource-principal-enabled-functions-in-gb-tour-2020-latam-compartment" --compartment-id $compartmentId  --statements "[ \"allow dynamic-group gb-tour-2020-latam-dynamic-group-functions to manage objects in compartment gb-tour-2020-latam\" ]" --description "to allow functions in gb-tour-2020-latam to read secrets"


Also create policy to access NoSQL Database and Streams from functions

## implementation (on OCI)

start cloudshell

git clone https://github.com/lucasjellema/cloud-native-on-oci-gbtour-latam2020-

cd /home/jellema/cloud-native-on-oci-gbtour-latam2020-/functions/tweet-summarizer

configure fn

export TENANCY_OCID=ocid1.tenancy.oc1..aaaaaaaag7c7slwmlvsodyym662ixlsonnihko2igwpjwwe2egmlf3gg6okq
export compartmentId=ocid1.compartment.oc1..aaaaaaaaf2a5o5jblcapqarilphbl4v6lop3nc2nyyt3mfpwmsandebwhwoa
export REGION=us-ashburn-1
export REGION=$(oci iam region-subscription list | jq -r '.data[0]."region-name"')
export REGION_KEY=$(oci iam region-subscription list | jq -r '.data[0]."region-key"')
export USER_OCID=$(oci iam user list --all | jq -r  '.data |sort_by(."time-created")| .[0]."id"')

fn create context gb-fn-context --provider oracle

fn use context gb-fn-context

fn update context oracle.compartment-id $compartmentId
fn update context api-url https://functions.$REGION.oci.oraclecloud.com
r=$(fn update context registry ${REGION_KEY,,}.ocir.io/$ns/cloudlab-repo)

fn update context oracle.profile FN
NAMESPACE=$(oci os ns get| jq -r  '.data')
USER_USERNAME=$(oci iam user list --all | jq -r  '.data |sort_by(."time-created")| .[0]."name"')
echo "Username for logging in into Container Registry is $NAMESPACE/$USER_USERNAME"

docker login ${REGION_KEY,,}.ocir.io


# create function  app
define SECRET_OCID on function app

fn create app "gb-app" --annotation "oracle.com/oci/subnetIds=[\"$subnetId\"]"

from the function's home directory:

fn -v deploy --app "gb-app"

echo -n '{"hashtag":"Biden", "minutes":50}' | fn invoke "gb-app" "tweet-summarizer" --content-type application/json

### technical design

module is implemented using Node
the module has a side-effect - creation of a file on OCI Object Storage; the module has a composed result object, that contains { "request" {startdate, enddate, hashtag}; "result" {number of tweets, filename, file OCID}}

* tweet-summarizer
  * retrieve tweets (given number of minutes and hashtags, retrieve tweets and return as JSON document) - this module needs Twitter credentials; it uses npm module twit
  * prepare tweet report (given result from retrieve tweets, produce JSON document)
  * write file to OCI object storage bucket - this module needs target compartment, namespace, bucket

  * oci-secret-retriever (to retrieve a secret from an OCI Vault) - takes secret OCID (or name?), vault OCID (or name) and compartment OCID (or name); returns the plain text (not base64 encoded) contents of the secret
  * oci-api-requestor (to make requests of OCI REST API - such as get secret from vault and write file to object storage) - this module need to use private key and config (either from local files or inject ); it uses npm modules http-signature and jssha

func.js => 
|
tweet-summarizer.js ( => oci-secret-retriever -> oci-api-requestor)
|- tweet-retriever (input: twitter credential provider, hashtag, number of minutes of history from now)  -> twit
|- tweet-report-processor (input: twitter search result)
|- oci-object-writer (input: print-ready JSON object, bucket)
   |- oci-api-requestor
|- oci-secret-retriever (input: secret ocid)
   |- oci-api-requestor   

testing is done through Jest

deployment as Function to OCI is done using OCI CLI

test cases