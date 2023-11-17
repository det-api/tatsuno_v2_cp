import express, { NextFunction, Request, Response } from "express";
import config from "config";
import cors from "cors";
import fileUpload from "express-fileupload";
import userRoute from "./router/user.routes";
import permitRoute from "./router/permit.routes";
import roleRoute from "./router/role.routes";
import detailSaleRoute from "./router/detailSale.routes";
import localToDeviceRoute from "./router/localToDevice.routes";
import coustomerRoute from "./router/coustomer.routes";
import deviceRoute from "./router/device.routes";
import dailyReportRoute from "./router/dailyReport.routes";
import fuelBalanceRoute from "./router/fuelBalance.routes";
import fuelInRoute from "./router/fuelIn.routes";
import { liveDataChangeHandler } from "./connection/liveTimeData";
import { detailSaleUpdateByDevice } from "./service/detailSale.service";
import dailyPriceRoute from "./router/dailyPrice.routes";
import dbConnect, { client, connect } from "./utils/connect";
import blinkLed, { lowLed } from "./connection/ledBlink";
import { rp, stationIdSet } from "./migrations/migrator";
import { getLastPrice } from "./service/dailyPrice.service";
import { get, mqttEmitter, set } from "./utils/helper";
import autoPermitRoute from "./router/autoPermit.routes";
import { autoPermitGet, autoPermitUpdate } from "./service/autoPermit.service";
import {
  apController,
  apFinalDropController,
  apPPController,
} from "./connection/apControl";

const app = express();
app.use(fileUpload());
app.use(cors({ origin: "*" }));

const server = require("http").createServer(app);

client.on("connect", connect);

client.on("message", async (topic, message) => {
  let data = topic.split("/");

  // console.log(data, message.toString());

  if (data[2] == "permit") {
    apController(data[3], message.toString().substring(0, 2));
  }

  if (data[2] == "active") {
    // blinkLed(Number(data[3]));
  }

  if (data[2] == "Final") {
    console.log(topic, message);
    let mode = await get("mode");
    detailSaleUpdateByDevice(data[3], message.toString());
    if (mode == "allow")
      await apFinalDropController(data[3], message.toString());
  }

  if (data[2] == "livedata") {
    let mode = await get("mode");
    liveDataChangeHandler(message.toString());
    if (mode == "allow")
      await apPPController(data[3], message.toString().substring(0, 2));
  }

  if (data[2] == "pricereq") {
    getLastPrice(message.toString());
  }
});

const port = config.get<number>("port");
const host = config.get<string>("host");
const wsServerUrl = config.get<string>("wsServerUrl");

// //mongodb connection

dbConnect();

const io = require("socket.io-client");

let socket = io.connect(wsServerUrl);

socket.on("connect", async () => {
  console.log("connect");
  let stationId = await get("stationId");

  if (!stationId) {
    await stationIdSet();
    stationId = get(stationId);
  }
  // Send data to the Raspberry Pi server
  socket.emit("checkMode", stationId);

  console.log(stationId)

  socket.on(stationId, async (data) => {
    console.log('wkkk')
    let result = await autoPermitUpdate(data.mode);
    console.log(result);
  });
});

socket.on("disconnect", () => {
  console.log("server disconnect");
});

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("ok");
});

app.use("/api/user", userRoute);
app.use("/api/permit", permitRoute);
app.use("/api/role", roleRoute);

app.use("/api/detail-sale", detailSaleRoute);

app.use("/api/device-connection", localToDeviceRoute);
app.use("/api/device", deviceRoute);

app.use("/api/daily-report", dailyReportRoute);
app.use("/api/fuel-balance", fuelBalanceRoute);
app.use("/api/fuelIn", fuelInRoute);

app.use("/api/daily-price", dailyPriceRoute);

app.use("/api/auto-permit", autoPermitRoute);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  err.status = err.status || 409;
  res.status(err.status).json({
    con: false,
    msg: err.message,
  });
});

const defaultData = async () => {
  // lowLed();

  await rp();
};

defaultData();

server.listen(port, () =>
  console.log(`server is running in  http://${host}:${port}`)
);
