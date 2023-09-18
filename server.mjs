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
    .project({ plot_embedding: 0 })

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





// Edit Request
app.put("/api/v1/story/:id", async (req, res) => {

  if (!ObjectId.isValid(req.params.id)) {
    res.status(403).send({ message: "incorrect product id" });
    return;
  }

  let story = {}

  if (req.body.title) story.title = req.body.title;
  if (req.body.body) story.body = req.body.body;

  try {
    const updateResponse = await postCollection
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: story }
      );

    console.log("Product updated: ", updateResponse);

    res.send({
      message: "story updated successfully"
    });

  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to update story, please try later" });
  }
});




// Delete Request
app.delete("/api/v1/story/:id", async (req, res) => {

  if (!ObjectId.isValid(req.params.id)) {
    res.status(403).send({ message: "incorrect product id" });
    return;
  }

  try {
    const deleteResponse = await postCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    console.log("Product deleted: ", deleteResponse);

    res.send({
      message: "story deleted successfully"
    });

  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to delete story, please try later" });
  }

});



// ports details
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});