import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const watch = new k8s.Watch(kc);

// Then this function determines what flow needs to happen
// Create, Update or Destroy?
async function onEvent(phase, apiObj) {
  log(`Received event in phase ${phase}.`);
  console.log(apiObj);
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
