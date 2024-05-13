import cluster from "cluster";
import { availableParallelism, setPriority } from "os";
import { randomUUID } from "crypto";
import express from "express";
import { scheduler } from "timers/promises";
import { execSync } from "child_process";

import { handler as handlerV1 } from "./lambda_a";
import { handler as handlerV2 } from "./lambda_b";
import { cpuUsage } from "process";

const numCPUs = availableParallelism();

if (cluster.isPrimary) {
  let ordered = true;
  const machineId = randomUUID();
  let isColdStart = true;
  console.log(`Master process ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();

    // Ugly but will do the job
    const cpuId = i % numCPUs;
    worker.on("online", () => {
      execSync(`taskset -cp ${cpuId} ${worker.process.pid}`);

      // Increase the priority of the worker
      setPriority(worker.process.pid as number, 0);
    });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker process ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

  // Decrease the priority of the master process
  setPriority(process.pid, 19);

  const app = express();

  app.get("/", async (req, res) => {
    res.json({
      message: "Hello from Duet Server",
      numCPUs,
      machineId,
    });
  });

  app.post("/invocations", async (req, res) => {
    let numReqs = 0;
    const temp = isColdStart;
    isColdStart = false;
    const resultByVersion: Record<1 | 2, any> = {
      1: null,
      2: null,
    };

    // Count requests
    function messageHandler(msg) {
      numReqs += 1;
      resultByVersion[msg.version] = msg;
    }

    for (const id in cluster.workers) {
      cluster.workers[id]?.on("message", messageHandler);
    }

    // Randomized interleaved trials
    if (ordered) {
      cluster.workers?.[Object.keys(cluster.workers)[0]]?.send({
        type: "request",
        version: 1,
        machineId,
        isColdStart: temp,
      });
      cluster.workers?.[Object.keys(cluster.workers)[1]]?.send({
        type: "request",
        version: 2,
        machineId,
        isColdStart: temp,
      });
    } else {
      cluster.workers?.[Object.keys(cluster.workers)[0]]?.send({
        type: "request",
        version: 2,
        machineId,
        isColdStart: temp,
      });
      cluster.workers?.[Object.keys(cluster.workers)[1]]?.send({
        type: "request",
        version: 1,
        machineId,
        isColdStart: temp,
      });
    }

    // Put process to sleep for 250ms to avoid stealing CPU cycles
    await scheduler.wait(250);

    // Wait for all workers to respond without stealing CPU cycles
    while (numReqs < 2) {
      // Sleep for more 250ms
      await scheduler.wait(250);
    }

    ordered = !ordered;

    res.json({
      message: "Hello from Duet Server",
      numCPUs,
      machineId,
      processId: process.pid,
      empiris_0: resultByVersion[1],
      empiris_1: resultByVersion[2],
      cpu: execSync("taskset -cp " + process.pid, { encoding: "utf8" }),
    });
  });

  const port = process.env.PORT || 8080;

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
} else {
  const originalFetch = global.fetch;
  let waitedForResponse = 0;

  // Overwrite fetch to intercept requests and deduct the latency from the duration
  global.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit | undefined
  ): Promise<Response> => {
    const start = performance.now();
    const response = await originalFetch(input, init);
    const duration = performance.now() - start;

    waitedForResponse += duration;

    return response;
  };

  process.on(
    "message",
    async (event: {
      type: "request";
      version: 1 | 2;
      machineId: string;
      isColdStart: boolean;
    }) => {
      const { version, machineId, isColdStart } = event;

      if (version === 1) {
        const requestReceivedAt = new Date().toISOString();
        console.log(`Worker process ${process.pid} is handling v1`);

        // TODO: Construct the request payload

        const cpuStart = cpuUsage();

        const result = await handlerV1({}, {});

        const cpu = cpuUsage(cpuStart);
        const duration = (cpu.user + cpu.system) / 1000;

        const requestFinishedAt = new Date().toISOString();

        console.log(`Worker process ${process.pid} handled v1`);

        process.send?.({
          version,
          // result,
          numCPUs,
          duration,
          durationWithoutNetwork: duration - waitedForResponse,
          requestReceivedAt,
          requestFinishedAt,
          processId: process.pid,
          machineId,
          isColdStart,
        });

        waitedForResponse = 0;
      } else if (version === 2) {
        const requestReceivedAt = new Date().toISOString();
        console.log(`Worker process ${process.pid} is handling v2`);

        const cpuStart = cpuUsage();

        const result = await handlerV2({}, {});

        const cpu = cpuUsage(cpuStart);
        const duration = (cpu.user + cpu.system) / 1000;

        const requestFinishedAt = new Date().toISOString();

        console.log(`Worker process ${process.pid} handled v2`);

        process.send?.({
          version,
          // result,
          numCPUs,
          duration,
          durationWithoutNetwork: duration - waitedForResponse,
          requestReceivedAt,
          requestFinishedAt,
          processId: process.pid,
          machineId,
          isColdStart,
        });

        waitedForResponse = 0;
      }
    }
  );
}
