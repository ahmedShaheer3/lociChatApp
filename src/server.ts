import "dotenv/config";
import { configDotenv } from "dotenv";

configDotenv({
  path: "./.env.dev",
});
/*
 ** Connectiong to database
 */
import { httpServer } from "./app";
import { connectToDatabase } from "./database";

const port = process.env.PORT || 443;

connectToDatabase()
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`⚙️ Server is running at port : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
