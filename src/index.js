import * as k8s from "@kubernetes/client-node";
import {
  deleteResource,
  applyPvc,
  applyDeployment,
  applyService,
  applyNfsPv,
  applyNfsPvc
} from "./operations.js";

const debugMode = process.env.DEBUG_MODE || "false";

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const watch = new k8s.Watch(kc);

async function onEvent(phase, apiObj) {
  log(`Received event in phase ${phase}.`);
  if (phase == "ADDED") {
    scheduleApplying(apiObj);
  } else if (phase == "MODIFIED") {
    try {
      scheduleApplying(apiObj);
    } catch (err) {
      log(err);
    }
  } else if (phase == "DELETED") {
    await deleteResource(apiObj, k8sCoreApi, k8sAppsApi);
  } else {
    log(`Unknown event type: ${phase}`);
  }
}

function onDone(err) {
  log(`Connection closed. ${err}`);
  watchResource();
}

async function watchResource() {
  log("Watching API");
  return watch.watch(
    "/apis/dganochenko.work/v1alpha1/rwmvolumes",
    {},
    onEvent,
    onDone
  );
}

let applyingScheduled = false;

function scheduleApplying(obj) {
  if (!applyingScheduled) {
    setTimeout(applyNow, 1000, obj);
    applyingScheduled = true;
  }
}

async function applyNow(obj) {
  applyingScheduled = false;
  applyPvc(obj, k8sCoreApi);
  applyDeployment(obj, k8sAppsApi);
  applyService(obj, k8sCoreApi);
  applyNfsPv(obj, k8sCoreApi);
  applyNfsPvc(obj, k8sCoreApi);
}

async function main() {
  await watchResource();
}

export function log(message) {
  console.log(`${new Date().toLocaleString()}: ${message}`);
}

if (debugMode == "true") {
  log("Debug mode ON!!!");
  process.on("unhandledRejection", (reason, p) => {
    console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  });
}

main();
