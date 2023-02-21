import * as k8s from "@kubernetes/client-node";
import {
  deleteResource,
  applyPvc,
  applyDeployment,
  applyService,
  applyNfsPv
} from "./operations.js";

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

// Creates the different clients for the different parts of the API.
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sApiMC = kc.makeApiClient(k8s.CustomObjectsApi);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

const watch = new k8s.Watch(kc);

// Then this function determines what flow needs to happen
// Create, Update or Destroy?
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

// Helpers to continue watching after an event
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
}

// The watch has begun
async function main() {
  await watchResource();
}

// Helper to pretty print logs
export function log(message) {
  console.log(`${new Date().toLocaleString()}: ${message}`);
}

// Helper to get better errors if we miss any promise rejection.
process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
});

// Run
main();
