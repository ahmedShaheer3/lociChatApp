import "dotenv/config";
import { configDotenv } from "dotenv";

configDotenv({
  path: "./.env.dev",
});
/*
 ** Connectiong to database
 */
import { app } from "./app";
import { connectToDatabase } from "./database";

const port = process.env.PORT || 8000;

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
