const express = require("express");
const cors = require("cors");
// const jwt = require("jsonwebtoken");
// require("dotenv").config();
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.port || 5000;
app.use(cors());
app.use(express.json());
// const user = process.env.DB_USER;
// const password = process.env.DB_PASSWORD;
// const uri = `mongodb+srv://${user}:${password}@cluster0.sm41jne.mongodb.net/?retryWrites=true&w=majority`;

app.get("/", async (req, res) => {
  res.send("okk boss");
});
app.listen(port, () => {
  console.log("listening on port", port);
});
