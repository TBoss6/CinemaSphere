//IMPORT PACKAGE
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const sanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const moviesRouter = require("./Routes/moviesRouter");
const authRouter = require("./Routes/authRouter");
const userRoute = require("./Routes/userRoute");
const CustomError = require("./Utils/CustomError");
const globalErrorHandler = require("./Controller/errorController");

let app = express();

const logger = (req, res, next) => {
  console.log("Custom middleware called");
  next();
};

let limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message:
    "We have received too many request from this IP, please try again in ome hour!",
});

// Creating a mounting Route
app.use(helmet());
app.use("/api", limiter);
app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));
app.use(express.static("./Public"));
app.use(sanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratings",
      "releasedYear",
      "releasedDate",
      "genres",
      "directors",
      "actors",
      "price",
    ],
  })
);
app.use(logger);

app.use((req, res, next) => {
  req.requestedAt = new Date().toISOString();
  next();
});

// USING ROUTES
app.use("/api/v1/movies", moviesRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRoute);
app.all("*", (req, res, next) => {
  /*---------1ST METHOD------------*/
  // res.status(404).json({
  //   status: "Fail",
  //   message: `Cannot find ${req.originalUrl} on the server`,
  // });

  /*---------2ND METHOD------------*/
  // const err = new Error(`Cannot find ${req.originalUrl} on the server`);
  // err.status = "fail";
  // err.statusCode = 404;

  /*---------3RD METHOD------------*/
  const err = new CustomError(
    `Cannot find ${req.originalUrl} on the server`,
    404
  );

  next(err);
});

app.use(globalErrorHandler);

module.exports = app;
