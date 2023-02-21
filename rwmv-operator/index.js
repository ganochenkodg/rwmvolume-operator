import * as k8s from '@kubernetes/client-node';
import { pvcTemplate } from './templates.js';

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
  if (phase == 'ADDED') {
    scheduleApplying(apiObj);
  } else if (phase == 'MODIFIED') {
    try {
      scheduleApplying(apiObj);
    } catch (err) {
      log(err);
    }
  } else if (phase == 'DELETED') {
    await deleteResource(apiObj);
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
  log('Watching API');
  return watch.watch(
    '/apis/dganochenko.work/v1alpha1/rwmvolumes',
    {},
    onEvent,
    onDone
  );
}

async function deleteResource(obj) {
  log(`Deleted ${obj.metadata.name}`);
  k8sApi.deleteNamespacedPersistentVolumeClaim(
    `${obj.metadata.name}-volume-pvc`,
    `${obj.metadata.namespace}`
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
  applyPVC(obj);
}

async function applyPVC(obj) {
  const objName = obj.metadata.name + '-volume-pvc';
  const objNamespace = obj.metadata.namespace;
  // read PVC and try to update it
  try {
    const response = await k8sCoreApi.readNamespacedPersistentVolumeClaim(
      `${objName}`,
      `${objNamespace}`
    );
    const newPvc = response.body;
    newPvc.spec.resources.requests.storage = obj.spec.capacity + 'Gi';
    k8sCoreApi.replaceNamespacedPersistentVolumeClaim(
      `${objName}`,
      `${objNamespace}`,
      newPvc
    );
    log(`PVC ${objName} was updated!`);
    return;
  } catch (err) {
    log(`Can't read ${objName} state...`);
    log(err);
  }
  try {
    const newpvcTemplate = pvcTemplate(obj);
    k8sCoreApi.createNamespacedPersistentVolumeClaim(
      `${objNamespace}`,
      newpvcTemplate
    );
    log(`PVC ${objName} was created!`);
    return;
  } catch (err) {
    log(err);
  }
}

// The watch has begun
async function main() {
  await watchResource();
}

// Helper to pretty print logs
function log(message) {
  console.log(`${new Date().toLocaleString()}: ${message}`);
}

// Helper to get better errors if we miss any promise rejection.
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

// Run
main();
