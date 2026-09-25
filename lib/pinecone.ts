import { Pinecone } from "@pinecone-database/pinecone";

const globalForPinecone = global as unknown as {
  pinecone: Pinecone;
};

const pinecone =
  globalForPinecone.pinecone ||
  new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

if (process.env.NODE_ENV !== "production") globalForPinecone.pinecone = pinecone;

export default pinecone;
