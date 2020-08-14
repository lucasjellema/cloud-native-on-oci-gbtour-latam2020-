# Tweet Report Digester

this module a tweet report from OCI Object Storage (as written by function Tweet Summarizer); each tweet from the report is persisted as record in an NoSQL Database and published as message on a Stream.

The name of the object to digest is passed in as input parameter - the bucket and namespace are taken from environment variables, as are the OCIDs for the table and stream to persist and publish to.


## technical notes
the module is to be wrapped in an Fn Function to be deployed on OCI Functions platform
when deployed as Function, the Function will benefit from a dynamic group policy on OCI to become Resource enabled (and get a generated private key and configuration file injected); when running stand alone, the module needs a stand alone OCI private key file and configuration file.


            OCI Private Key & Config
             |  
             v                     => OCI NoSQL Database
Fn func =>  Tweet Report Digester  => OCI Streaming
             |           
             v           
      OCI Object Storage

Note: environment details are not passed to the module as (functional) parameter, but instead through environment variables. Variables can be set for:
- OCI authentication: OCI config & private key
- OCI Object Storage: bucket, namespace (, compartment?)      
 Environment Variables: 
 App: COMPARTMENT_OCID,  REGION, OCI_NAMESPACE 
 Function: TABLE_OCID, STREAM_OCID,TWITTER_REPORTS_BUCKET

assumption:
Function through a Dynamic Group benefit from policy that allows the dynamic group to read from Object Storage, write to NoSQL Databasea and to publish to Stream

## Dynamic Group and Policy 
Create dynamic group *functions-in-gb-compartment* that has all functions in compartment *gb-compartment* as member:

export TENANCY_OCID=ocid1.tenancy.oc1..aaaaaaaag7c7slwmlvsodyym662ixlsonnihko2igwpjwwe2egmlf3gg6okq
export compartmentId=ocid1.compartment.oc1..aaaaaaaaf2a5o5jblcapqarilphbl4v6lop3nc2nyyt3mfpwmsandebwhwoa
export REGION=us-ashburn-1
oci iam dynamic-group create --compartment-id $TENANCY_OCID --name "gb-tour-2020-latam-dynamic-group-functions" --description "to collect all functions in compartment gb-tour-2020-latam"  --matching-rule "[ \"ALL {resource.type = 'fnfunc', resource.compartment.id = '$compartmentId'}\"]" 

Create a policy that grants read access on objects in Object Storage in the *gb-tour-2020-latam* to all functions in that compartment :
oci iam policy create  --name "read-object-permissions-for-resource-principal-enabled-functions-in-gb-tour-2020-latam-compartment" --compartment-id $compartmentId  --statements "[ \"allow dynamic-group gb-tour-2020-latam-dynamic-group-functions to read objects in compartment gb-tour-2020-latam\" ]" --description "to allow functions in gb-tour-2020-latam to read objects"

Create a policy that grants publish to Stream in the *gb-tour-2020-latam* to all functions in that compartment :
oci iam policy create  --name "publish-stream-permissions-for-resource-principal-enabled-functions-in-lab-compartment" --compartment-id $compartmentId  --statements "[ \"allow dynamic-group functions-in-lab-compartment to use stream-push  in compartment lab-compartment\" ]" --description "to allow functions in lab-compartment to push messages to streams"

Create a policy that grants create record in NoSQL Database in the *gb-tour-2020-latam* to all functions in that compartment :
oci iam policy create  --name "update-row-permissions-for-resource-principal-enabled-functions-in-lab-compartment" --compartment-id $compartmentId  --statements "[ \"allow dynamic-group functions-in-lab-compartment to use nosql-rows in compartment lab-compartment\" ]" --description "to allow functions in compartment lab to read, create and update table rows in NoSQL Tables in Compartment Lab"


Also create policy to access NoSQL Database and Streams from functions

## implementation (on OCI)

start cloudshell

git clone https://github.com/lucasjellema/cloud-native-on-oci-gbtour-latam2020-

cd cloud-native-on-oci-gbtour-latam2020-/functions/tweet-report/digester

fn use context us-ashburn-1

# set lab-compartment as context
fn update context oracle.compartment-id ocid1.compartment.oc1..aaaaaaaa5q2srleka3ll2xgpcdj3uns3nshzc3lbn2wgx2kcuah5blh47icq  


# create function  app
from the function's home directory:

fn -v deploy --app "lab1"

echo -n '{"filename":"tweets-Biden-2020-08-13T10:58:16.json"}' | fn invoke "lab1" "tweet-report-digester" --content-type application/json

### technical design

module is implemented using Node
the module has a side-effect - creation of records in NoSQL Database table and messages on a Stream; the module has a composed result object

func.js => 
|
tweet-report-digester.js 
|- oci-object-reader 
|- tweet-streamer 
   |- oci-api-requestor
|- tweet-persister
   |- oci-nosql-database-persister
      |- oci-api-requestor   

testing is done through Jest

deployment as Function to OCI is done using OCI CLI

