const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { application } = require("express");
const app = express();
const port = process.env.port || 5000;
app.use(cors());
app.use(express.json());
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const uri = `mongodb+srv://${user}:${password}@cluster0.g5jzoct.mongodb.net/?retryWrites=true&w=majority`;
const stripe = require("stripe")(process.env.STRIPE_SECRET);
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
    const productCollection = client.db("products").collection("products");
    const soldProductCollection = client
      .db("products")
      .collection("soldProducts");
    const categoriesCollection = client
      .db("products")
      .collection("productCategories");

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
      const query = {
        email,
      };

      const result1 = await userCollection.findOne(query);
      if (!result1) {
        const result = await userCollection.insertOne(userInfo);
        return res.send(result);
      }
      res.send({ acknowledged: true });
    });
    app.get("/role", async (req, res) => {
      const userUid = req.query.userUid;
      const query = { userUid };
      const result = await userCollection.findOne(query);
      res.send({ role: result?.role });
    });
    app.post("/addproduct", verifyJWT, async (req, res) => {
      productInfo = req.body;
      const result = await productCollection.insertOne(productInfo);
      res.send(result);
    });
    app.get("/myproducts", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = {
        sellerEmail: email,
      };
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/delete", async (req, res) => {
      const _id = req.query._id;
      const query = {
        _id: ObjectId(_id),
      };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/productsdetails", async (req, res) => {
      const _id = req.query._id;
      const query = {
        _id: ObjectId(_id),
      };
      const result = await productCollection.findOne(query);
      res.send(result);
    });
    app.put("/makeadvertisement", async (req, res) => {
      const _id = req.query._id;
      const filter = {
        _id: ObjectId(_id),
      };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          isAdvertise: true,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    app.get("/advertisedproducts", async (req, res) => {
      const query = { isAdvertise: true, sellingStatus: "unsold" };
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/buyproduct", async (req, res) => {
      const buyingInfo = req.body;
      const post_id = buyingInfo?.post_id;
      const result = await soldProductCollection.insertOne(buyingInfo);
      if (result?.acknowledged) {
        const filter = {
          _id: ObjectId(post_id),
        };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            sellingStatus: "sold",
          },
        };
        const result = await productCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        if (result?.acknowledged) {
          return res.send(result);
        }
      }
      res.send({ acknowledged: false });
    });
    app.get("/mybuyers", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = {
        sellerEmail: email,
      };
      const result = await soldProductCollection.find(query).toArray();
      let myBuyersEmail = [];
      let myBuyers = [];
      result.forEach((eachSoldInfo) => {
        let email = eachSoldInfo?.buyerEmail;
        if (!myBuyersEmail.includes(email)) {
          myBuyersEmail.push(email);
          const { buyerName, buyerEmail, buyerPhone, buyerImage } =
            eachSoldInfo;
          const buyerInfo = { buyerName, buyerEmail, buyerPhone, buyerImage };
          myBuyers.push(buyerInfo);
        }
      });
      res.send(myBuyers);
    });
    app.get("/reporttoadmin", async (req, res) => {
      const _id = req.query._id;
      const filter = {
        _id: ObjectId(_id),
      };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          isReported: true,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    app.get("/myorders", async (req, res) => {
      const email = req.query.email;
      const query = {
        buyerEmail: email,
      };
      const result = await soldProductCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/allbuyers", async (req, res) => {
      const query = {};
      const result = await soldProductCollection.find(query).toArray();
      let allBuyersEmail = [];
      let allBuyers = [];
      result.forEach((eachSoldInfo) => {
        let email = eachSoldInfo?.buyerEmail;
        if (!allBuyersEmail.includes(email)) {
          allBuyersEmail.push(email);
          const { buyerName, buyerEmail, buyerPhone, buyerImage } =
            eachSoldInfo;
          const buyerInfo = { buyerName, buyerEmail, buyerPhone, buyerImage };
          allBuyers.push(buyerInfo);
        }
      });
      res.send(allBuyers);
    });
    app.get("/allsellers", async (req, res) => {
      const query = { role: "seller" };
      const allSellers = await userCollection.find(query).toArray();
      res.send(allSellers);
    });
    app.post("/verifyseller", async (req, res) => {
      const sellerEmail = req.query.sellerEmail;
      const filter = { email: sellerEmail };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          isVerified: true,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      if (result.acknowledged) {
        const filter1 = { sellerEmail };
        const updateDoc1 = {
          $set: {
            sellerVerified: true,
          },
        };
        const result1 = await productCollection.updateMany(
          filter1,
          updateDoc1,
          options
        );

        const result2 = await soldProductCollection.updateMany(
          filter1,
          updateDoc1,
          options
        );
        return res.send(result2);
      }
      res.send({ message: "something wrong" });
    });
    app.get("/reporteditems", async (req, res) => {
      const query = { isReported: true };
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/catetories", async (req, res) => {
      const result = await categoriesCollection.find({}).toArray();
      res.send(result);
    });
    app.get("/productsbycategory", async (req, res) => {
      const categoryName = req.query.categoryName;
      let query;
      if (categoryName === "all") {
        query = {};
      } else {
        query = { category: categoryName };
      }

      const result = await productCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/soldproductdetails", async (req, res) => {
      const _id = req.query._id;
      const query = { _id: ObjectId(_id) };
      const result = await soldProductCollection.findOne(query);
      res.send(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    app.post("/setpaymentstatus", async (req, res) => {
      const query = req.query;
      const { post_id, paymentId } = query;
      const filter1 = {
        post_id: post_id,
      };
      const filter2 = { _id: ObjectId(post_id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          paymentStatus: "paid",
          paymentId,
        },
      };
      const result1 = await soldProductCollection.updateOne(
        filter1,
        updateDoc,
        options
      );
      console.log(result1);
      if (result1?.acknowledged) {
        const result2 = await productCollection.updateOne(
          filter2,
          updateDoc,
          options
        );
        if (result2?.acknowledged) {
          return res.send(result2);
        }
      } else {
        res.send({ acknowledged: false });
      }

      res.send({ status: "something wrong" });
    });
  } finally {
  }
}
run().catch(console.log());

app.listen(port, () => {
  console.log("listening on port, ", port);
});
