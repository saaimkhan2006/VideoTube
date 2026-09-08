import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

const { app } = await import("./app.js");
const { default: connectDB } = await import("./db/index.js");

const PORT = process.env.PORT || 8001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server listeing on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Mongodb connection error", err);
  });
