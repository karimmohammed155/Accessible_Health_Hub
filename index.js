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
  adminRouter,
  productRouter
} from "./src/modules/index.js";
const app = express();
dotenv.config();

const port = process.env.PORT;

await connectDB();

app.use(express.json());
app.use("/user", user_router);
app.use("/category", category_router);
app.use("/sub_category", sub_category_router);
app.use("/post", post_router);
app.use("/interaction", interaction_router);
app.use("/comment", comment_router);
app.use('/admin',adminRouter);
app.use('/product',productRouter);


app.all("/*", (req, res, next) => {
  return next(new Error("Page not found", { cause: 404 }));
});

app.use((error, req, res, next) => {
  const statusCode = error.cause || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message,
    stack: error.stack,
  });
});

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}`)
);
