const express = require("express");
const moviesController = require("./../Controller/moviesController");
const authController = require("./../Controller/authController");

const router = express.Router();

// router.param("id", moviesController.checkId);
router
  .route("/highest-rated")
  .get(moviesController.getHighestRated, moviesController.getAllMovies);

router.route("/movie-stats").get(moviesController.getMovieStats);
router.route("/movies-by-genre/:genre").get(moviesController.getMovieGenre);

router
  .route("/")
  .get(authController.protect, moviesController.getAllMovies)
  .post(moviesController.createNewMovie);
router
  .route("/:id")
  .get(authController.protect, moviesController.getSingleMovie)
  .patch(moviesController.updateMovie)
  .delete(
    authController.protect,
    authController.restrict("admin"),
    moviesController.deleteMovie
  );

module.exports = router;
