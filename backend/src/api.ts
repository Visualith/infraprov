import { Express } from "express";
import http from "http";

export default class ApiServer {
  static async start(app: Express, httpServer: http.Server): Promise<void> {
    app.post("/init", async (req, res) => {
      res.send(JSON.stringify({})).end();
    });
  }
}
