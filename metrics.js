const winston = require("winston");

const now = new Date().toISOString();

// Turn into windows friendly file name
// 2021-06-30T15:00:00.000Z -> 2021-06-30T15-00-00-000Z
const windowsFriendlyNow = now.replace(/:/g, "-").replace(".", "-");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: `./logs/${windowsFriendlyNow}.log`,
    }),
  ],
});

function trackResponseTimeWithoutQueueTime(req, res, context, events, done) {
  const {
    machineId: empiris0MachineId,
    processId: empiris0ProcessId,
    isColdStart: empiris0IsColdStart,
    durationWithoutNetwork: empiris0Duration,
    requestReceivedAt: empiris0RequestReceivedAt,
  } = JSON.parse(res.body).empiris_0;

  const {
    machineId: empiris1MachineId,
    processId: empiris1ProcessId,
    isColdStart: empiris1IsColdStart,
    durationWithoutNetwork: empiris1Duration,
    requestReceivedAt: empiris1RequestReceivedAt,
  } = JSON.parse(res.body).empiris_1;

  events.emit("histogram", `empiris_0_response_time`, empiris0Duration);

  logger.info(
    `A - Response Time: ${empiris0Duration}ms, machineId: ${empiris0MachineId}, processId: ${empiris0ProcessId}, isColdStart: ${empiris0IsColdStart}, requestReceivedAt: ${empiris0RequestReceivedAt} | B - Response Time: ${empiris1Duration}ms, machineId: ${empiris1MachineId}, processId: ${empiris1ProcessId}, isColdStart: ${empiris1IsColdStart}, requestReceivedAt: ${empiris1RequestReceivedAt}`
  );

  events.emit("histogram", `empiris_1_response_time`, empiris1Duration);

  return done();
}

module.exports = { trackResponseTimeWithoutQueueTime };
