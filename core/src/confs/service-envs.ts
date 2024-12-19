export const ENVS = {
  DEV: {
    JWT_KEY: "pF4lCSBlJuvYxoNU3rLAGRRKNNT9EOEeQSRpK3UU4hw=",
    MONGO_URI:
      "mongodb://ebaz-dev:774CPXo65J8i@10.8.81.85:27017/ebaz-dev?directConnection=true",
    NATS_CLUSTER_ID: "nats_dev",
    NATS_URL: "https://apidev-pro.ebazaar.mn:4222",
  },
  STAG: {
    JWT_KEY: "pF4lCSBlJuvYxoNU3rLAGRRKNNT9EOEeQSRpK3UU3hw=",
    MONGO_URI:
      "mongodb://ebaz-dev:774CPXo65J8i@10.8.81.85:27017/ebaz-dev?directConnection=true",
    NATS_CLUSTER_ID: "nats_dev",
    NATS_URL: "http://103.229.178.75:4222",
  },
  PROD: {
    JWT_KEY: "pF4lCSBlJuvYxoNU3rLAGRRKNNT9EOEeQSRpK3UU3hw=",
    MONGO_URI:
      "mongodb://ebaz-dev:774CPXo65J8i@10.8.81.85:27017/ebaz-dev?directConnection=true",
    NATS_CLUSTER_ID: "nats_dev",
    NATS_URL: "http://103.229.178.75:4222",
  },
};
