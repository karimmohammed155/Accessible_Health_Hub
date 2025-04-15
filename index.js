import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./DB/connection.js";
import {
  category_router,
  comment_router,
  interaction_router,
  post_router,
  sub_category_router,
  user_router,
} from "./src/modules/index.js";
import { global_response } from "./src/middleware/index.js";
const app = express();
dotenv.config();

const port = process.env.PORT;


app.use(express.json());
app.use("/user", user_router);
app.use("/category", category_router);
app.use("/sub_category", sub_category_router);
app.use("/post", post_router);
app.use("/interaction", interaction_router);
app.use("/comment", comment_router);
app.use(global_response);


connectDB();
app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
