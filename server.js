const { Mongodb } = require("./mongoDb/mongoDb");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("uncaught Exception occured! Shutting down...");
  process.exit(1);
});
const app = require("./app");

console.log(app.get("env"));
// console.log(process.env);

const port = process.env.PORT || 8080;

const server = app.listen(port, () => {
  Mongodb();
  console.log("Server has started...");
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("unhandled rejection occured! Shutting down...");

  server.close(() => {
    process.exit(1);
  });
});
