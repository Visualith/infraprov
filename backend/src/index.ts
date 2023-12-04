import * as dotenv from 'dotenv';

const envPath = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.staging';
dotenv.config({ path: envPath });

import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import routes from "./routes";
import connect from "./db/connect";
import swaggerDocs from "./utils/swagger";
import { restResponseTimeHistogram,startMetricsServer } from "./utils/metric";
import responseTime from "response-time";
import logger from "./utils/logger";


const app = express();

app.use(cors());

app.use(express.json({
  limit: '50mb'
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '50mb' 
}));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});


const rootPath = path.join(__dirname, "..", "..");
const staticPath = path.join(rootPath, "client", "build");
console.log(`Serving static files from: ${staticPath}`);
app.use("/", express.static(staticPath));

app.use(
  responseTime((req: Request, res: Response, time: number) => {
    if (req?.route?.path) {
      restResponseTimeHistogram.observe(
        {
          method: req.method,
          route: req.route.path,
          status_code: res.statusCode,
        },
        time * 1000
      );
    }
  })
);



const port = process.env.PORT || 8085;

app.listen(port, async () => {
  logger.info(`App is running at http://localhost:${port}`);

  await connect();

  routes(app);


  swaggerDocs(app, 9100);
});
console.log(`Server listening on port!: ${port}`);



