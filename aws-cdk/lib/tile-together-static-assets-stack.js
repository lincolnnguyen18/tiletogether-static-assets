const { Stack } = require('aws-cdk-lib');
const { Bucket } = require('aws-cdk-lib/aws-s3');
const { BucketDeployment,
  Source
} = require('aws-cdk-lib/aws-s3-deployment');

class TileTogetherStaticAssetsStack
  extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const tiletogetherStaticAssetsBucket = new Bucket(this, 'tiletogether-static-assets-bucket', {
      bucketName: 'tiletogether-static-assets-bucket',
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
    });

    new BucketDeployment(this, 'tiletogether-static-assets-deployment', {
      sources: [Source.asset('./website/')],
      destinationBucket: tiletogetherStaticAssetsBucket,
    });
  }
}

module.exports = { TileTogetherStaticAssetsStack }
