const fs = require("fs");
const Movie = require("./../Models/movieModel");
const Apifeatures = require("./../Utils/ApiFeatures");
const CustomError = require("../Utils/CustomError");

let movies = JSON.parse(fs.readFileSync("./data/movies.json"));

// exports.checkId = (req, res, next, value) => {
//   console.log(`Movie ID is ${value}`);

//   //FIND MOVIE BASED ON ID PARAMETER
//   let movie = movies.find((el) => el.id === Number(value));

//   if (!movie) {
//     return res.status(404).json({
//       status: "Fail",
//       message: `Movie with the Id of ${value} is not found`,
//     });
//   }
//   next();
// };
//*****To check if incoming Data has a Name or Released year*****/
// exports.validateBody = (req, res, next) => {
//   if (!req.body.name) {
//     return res.status(400).json({
//       status: "Fail",
//       message: "Movie name is mandatory!",
//     });
//   } else if (!req.body.releasedYear) {
//     return res.status(400).json({
//       status: "Fail",
//       message: "Movie released Year is mandatory!",
//     });
//   }
//   next();
// };

exports.getHighestRated = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratings";
  console.log("Query parameters in getHighestRated:", req.query); // Log the query parameters

  next();
};

exports.getAllMovies = async (req, res) => {
  try {
    const features = new Apifeatures(Movie.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let movies = await features.query;
    // let movies = await Movie.find().sort({ ratings: -1 }).limit(5);

    res.status(200).json({
      status: "Success",
      length: movies.length,
      data: {
        movies,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.createNewMovie = async (req, res, next) => {
  try {
    const newMovie = await Movie.create(req.body);

    res.status(201).json({
      status: "Success",
      data: {
        newMovie,
      },
    });
  } catch (error) {
    return next(error); // Pass the original error to the global handler
    // const err = new CustomError(error.message, 404);
    // next(err);
  }
  // const bodyData = req.body;
  // console.log(bodyData);
  // const newId = movies[movies.length - 1].id + 1;
  // const newMovie = Object.assign({ id: newId }, bodyData);
  // console.log(newMovie);
  // movies.push(newMovie);
  // fs.writeFile("./data/movies.json", JSON.stringify(movies), (err) => {
  //   res.status(201).json({
  //     status: "success",
  //     data: {
  //       movie: newMovie,
  //     },
  //   });
  // });
  // // res.send("Created");
};

// exports.getSingleMovie = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const movie = await Movie.findById(id);

//     // if (!movie) {
//     /* 1ST METHOD TO HANDLE INVALID ID */
//     // return res.status(404).json({
//     //   status: "Fail",
//     //   message: `Movie with the Id of ${id} is not found`,
//     // });

//     /* 2ND METHOD TO HANDLE INVALID ID USING ERROR HANDLER */
//     //   const err = new CustomError(
//     //     `Movie with the Id of ${id} was not found`,
//     //     404
//     //   );
//     //   return next(err);
//     // }

//     res.status(200).json({
//       status: "Success",
//       data: {
//         movie,
//       },
//     });
//   } catch (error) {
//     // res.status(400).json({
//     //   status: "Fail",
//     //   message: error.message,
//     // });

//     const err = new CustomError(error.message, 500);
//     return next(err);
//   }

exports.getSingleMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findById(id);

    if (!movie) {
      const err = new CustomError(
        `Movie with the Id of ${id} was not found`,
        404
      );
      return next(err);
    }

    res.status(200).json({
      status: "Success",
      data: {
        movie,
      },
    });
  } catch (error) {
    return next(error); // Pass the original error to the global handler
  }
};

// let movie = movies.find((el) => el.id === id);
// // if (!movie) {
// //   return res.status(404).json({
// //     status: "Fail",
// //     message: `Movie with the Id of ${id} is not found`,
// //   });
// // }
// res.status(200).json({
//   status: "success",
//   data: {
//     movie: movie,
//   },
// });
// };

exports.updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const newData = req.body;
    const updataedMovie = await Movie.findByIdAndUpdate(id, newData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "Success",
      data: {
        movie: updataedMovie,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
  // const id = Number(req.params.id);
  // let movieToPatch = movies.find((el) => el.id === id);
  // // if (!movieToPatch) {
  // //   return res.status(404).json({
  // //     status: "Fail",
  // //     Message: `The movie with the id ${id} was not found!`,
  // //   });
  // // }
  // let index = movies.indexOf(movieToPatch);
  // Object.assign(movieToPatch, req.body);
  // movies[index] = movieToPatch;
  // fs.writeFile("./data/movies.json", JSON.stringify(movies), (err) => {
  //   res.status(200).json({
  //     status: "success",
  //     data: {
  //       movie: movieToPatch,
  //     },
  //   });
  // });
};

exports.deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const movieToBeDeleted = await Movie.findById(id);
    const movie = await Movie.findByIdAndDelete(id);

    if (!movieToBeDeleted) {
      return res.status(404).json({
        status: "Fail",
        message: `Movie with the Id of ${id} is not found`,
      });
    }
    res.status(200).json({
      status: "Success",
      message: `Movie Data with the id ${id} has been deleted successfully`,
      response: movieToBeDeleted,
    });
  } catch (error) {
    res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
  // const id = Number(req.params.id);
  // const movieToDelete = movies.find((el) => el.id == id);
  // // if (!movieToDelete) {
  // //   return res.status(404).json({
  // //     status: "fail",
  // //     message: `No movie object with id ${id} was found to delete`,
  // //   });
  // // }
  // const index = movies.indexOf(movieToDelete);
  // movies.splice(index, 1);
  // fs.writeFile("./data/movies.json", JSON.stringify(movies), (err) => {
  //   res.status(204).json({
  //     status: "success",
  //     data: {
  //       movie: null,
  //     },
  //   });
  // });
};

exports.getMovieStats = async (req, res) => {
  try {
    const stats = await Movie.aggregate([
      // { $match: { releasedDate: { $lte: new Date() } } },
      { $match: { ratings: { $gte: 4.5 } } },
      {
        $group: {
          _id: `$releasedYear`,
          avgRating: { $avg: "$ratings" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          priceTotal: { $sum: "$price" },
          movieCount: { $sum: 1 },
        },
      },
      { $sort: { minPrice: 1 } },
      // { $match: { maxPrice: { $gte: 65 } } },
    ]);
    res.status(200).json({
      status: "Success",
      length: stats.length,
      data: {
        stats,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.getMovieGenre = async (req, res) => {
  try {
    const genre = req.params.genre;
    const movies = await Movie.aggregate([
      { $unwind: `$genres` },
      {
        $group: {
          _id: `$genres`,
          movieCount: { $sum: 1 },
          movies: { $push: `$name` },
        },
      },
      { $addFields: { genre: `$_id` } },
      { $project: { _id: 0 } },
      { $sort: { movieCount: -1 } },
      // { $limit: 6 },
      { $match: { genre: genre } },
    ]);
    res.status(200).json({
      status: "Success",
      length: movies.length,
      data: {
        movies,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};
