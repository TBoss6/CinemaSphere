const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const mongodb_Url = process.env.mongodb_url;
exports.Mongodb = async () => {
  // try {
  await mongoose.connect(mongodb_Url).then((connect) => {
    // console.log(connect);
    console.log("========Database Connected Successfully========");
  });
  //   } catch (error) {
  //     console.log("Database connection error:", error);
  //   }
};
