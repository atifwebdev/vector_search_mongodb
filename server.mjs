import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import OpenAI from "openai";
import cors from 'cors';
import './config/index.mjs'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });


const mongodbURI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.kftjmt2.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(mongodbURI);
const database = client.db('socialstories');
const postCollection = database.collection('posts');

async function run() {
    try {
      await client.connect();
      await client.db("socialstories").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // await client.close();
    }
  }
  run().catch(console.dir);


const app = express();
app.use(express.json());
app.use(cors([]));


// server API root path
app.get("/", (req, res) => {
    res.send("My CRUD app using Mongodb and Vector Search of Open AI");
});


// Get Data Request
app.get("/api/v1/stories", async (req, res) => {
    const cursor = postCollection
      .find({})
      .sort({ _id: -1 })
      .project({ plot_embedding: 1 })
  
    try {
      const allStories = await cursor.toArray();
      res.send(allStories);
  
    } catch (error) {
      console.log("error", error);
      res.status(500).send({ message: "failed to get stories, please try later" });
    }
  });


// Post Data Request
app.post("/api/v1/story", async (req, res) => {

    try {
      const doc = {
        title: req?.body?.title,
        body: req?.body?.body,
        $currentDate: {
          createdOn: true
        },
      }
  
      const result = await postCollection.insertOne(doc);
      console.log("result: ", result);
      res.send({
        message: "story created successfully"
      });
    } catch (error) {
      console.log("error: ", error);
      res.status(500).send({ message: "Failed to add, please try later" })
    }
  });



// ports details
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});