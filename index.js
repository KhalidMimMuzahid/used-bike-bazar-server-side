const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.port || 5000;
app.use(cors());
app.use(express.json());
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const uri = `mongodb+srv://${user}:${password}@cluster0.g5jzoct.mongodb.net/?retryWrites=true&w=majority`;
app.get("/", async (req, res) => {
  res.send("okk boss");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const userCollection = client.db("users").collection("users");

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "5h",
        });

        return res.send({ token });
      }

      res.send({ token: "" });
    });

    const verifyJWT = (req, res, next) => {
      if (!req.headers.authorization) {
        console.log("before step 1 , authorization is here");
        return res.status(401).send("unauthorised access");
      }
      const token = req.headers.authorization.split(" ")[1];

      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        function (err, decoded) {
          if (err) {
            return res.status(403).send("forbidden access");
          }
          req.decoded = decoded;
          next();
        }
      );
    };

    app.post("/user", async (req, res) => {
      const userInfo = req.body;
      const email = userInfo?.email;
      console.log(userInfo);
      const query = {
        email,
      };

      const result1 = await userCollection.findOne(query);
      console.log(result1);
      if (!result1) {
        const result = await userCollection.insertOne(userInfo);
        return res.send(result);
      }
      res.send({ acknowledged: true });
    });
  } finally {
  }
}
run().catch(console.log());

app.listen(port, () => {
  console.log("listening on port", port);
});
