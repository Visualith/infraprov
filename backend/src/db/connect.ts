import mongoose from "mongoose";
import log from "../logger";
import * as dotenv from 'dotenv';

dotenv.config();

const DB_URI: string | undefined = process.env.DB_URI;

function connect() {
  // Check if DB_URI is defined
  if (!DB_URI) {
    log.error("DB_URI is not defined in the environment variables.");
    process.exit(1);
  }

  // Mongoose connection events
  mongoose.connection.on('connected', function () {
    log.info('Mongoose default connection open');
  });

  mongoose.connection.on('error', function (err) {
    log.error('Mongoose default connection error:', err);
  });

  mongoose.connection.on('disconnected', function () {
    log.warn('Mongoose default connection disconnected');
  });

  mongoose
    .connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      log.info("Database connected");
    })
    .catch((error) => {
      log.error("Database connection error:", error);
      process.exit(1);
    });
}

export default connect;
