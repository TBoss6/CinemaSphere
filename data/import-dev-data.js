const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const Movie = require("./../Models/movieModel");

dotenv.config({ path: "./config.env" });

const mongodb_Url = process.env.mongodb_url;

//CONNECT TO MONGOOSE
mongoose
  .connect(mongodb_Url)
  .then((connect) => {
    console.log("========Database Connected Successfully========");
  })
  .catch((error) => {
    console.log("Database connection error:", error);
  });

//READ MOVIES.JSON FILE
const movies = JSON.parse(fs.readFileSync("./data/movies.json", "utf-8"));

//DELETE EXISTING MOVIE DOCUMENT FROM COLLECTION
const deleteMovies = async () => {
  try {
    await Movie.deleteMany();
    console.log("Data successfully deleted");
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

//IMPORT MOVIES DATA TO MON GODB COLLECTION
const importMovies = async () => {
  try {
    await Movie.create(movies);
    console.log("Data successfully imported");
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importMovies();
} else if (process.argv[2] === "--delete") {
  deleteMovies();
}
