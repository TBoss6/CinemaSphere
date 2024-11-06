const mongoose = require("mongoose");
const fs = require("fs");
const validator = require("validator");

const movieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is a required field"],
      maxlength: [100, "Movie name must not exceed 100 characters"],
      minlength: [4, "Movie name cannot be less than 4 characters"],
      unique: true,
      trim: true,
      // validate: [validator.isAlpha, "No special characters is allowed"],
    },
    description: {
      type: String,
      required: [true, "Name is a required field"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is a required field"],
    },
    ratings: {
      type: Number,
      validate: {
        validator: function (value) {
          return value >= 1 && value <= 10;
        },
        message: `Ratings must be at least 1 and atmost 10 but you entered {VALUE}`,
      },
      // min: [1, "Ratings must be at least 1 or above"],
      // max: [10, "Ratings must be 10 or below"],
    },
    totalRating: {
      type: Number,
    },
    releasedYear: {
      type: Number,
      required: [true, "Release year is a required field"],
    },
    releasedDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    genres: {
      type: [String],
      required: [true, "Genres is a required field"],
      // enum: {
      //   values: ["Action", "Adventure", "Sci-fi", "Thriller", "Crime", "Drama", "Comedy", "Romance", "Biography", "Suspense", "Fantansy"],
      //   message: "This genre does not exist"
      // }
    },
    directors: {
      type: [String],
      required: [true, "Directors is a required field"],
    },
    coverImage: {
      type: [String],
      required: [true, "Cover image is a required field"],
    },
    actors: {
      type: [String],
      required: [true, "Actors is a required field"],
    },
    price: {
      type: Number,
      required: [true, "Price is a required field"],
    },
    createdBy: {
      type: String,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
movieSchema.virtual("durationInHours").get(function () {
  return this.duration / 60;
});

// EXECUTED BEFORE THE DOCUMENT IS SAVED TO DB
//.save() or .create()
movieSchema.pre("save", function (next) {
  this.createdBy = "Titan";
  next();
});

movieSchema.post("save", function (doc, next) {
  const content = `A new Movie document with the name ${doc.name} has been created by ${doc.createdBy}\n`;
  fs.writeFileSync("./Log/log.txt ", content, { flag: "a" }, (err) => {
    console.log(err.message);
  });
  next();
});

movieSchema.pre(/^find/, function (next) {
  this.find({ releasedDate: { $lte: Date.now() } });
  this.startTime = Date.now();
  next();
});

movieSchema.post(/^find/, function (docs, next) {
  this.find({ releasedDate: { $lte: Date.now() } });
  this.endTime = Date.now();

  const content = `Query took ${
    this.endTime - this.startTime
  } milliseconds to fetch the documents`;
  fs.writeFileSync("./Log/log.txt ", content, { flag: "a" }, (err) => {
    console.log(err.message);
  });

  next();
});

movieSchema.pre("aggregate", function (next) {
  console.log(
    this.pipeline().unshift({ $match: { releasedDate: { $lte: new Date() } } })
  );
  next();
});

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;
