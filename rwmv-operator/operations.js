import { log } from "./index.js";
import { pvcTemplate, nfsDeploymentTemplate } from "./templates.js";

export async function deleteResource(obj, k8sCoreApi, k8sAppsApi) {
  log(`Deleted ${obj.metadata.name}`);
  k8sAppsApi.deleteNamespacedDeployment(
    `${obj.metadata.name}-nfs-server`,
    `${obj.metadata.namespace}`
  );
  k8sCoreApi.deleteNamespacedPersistentVolumeClaim(
    `${obj.metadata.name}-volume-pvc`,
    `${obj.metadata.namespace}`
  );
}

export async function applyPvc(obj, k8sCoreApi) {
  const objName = obj.metadata.name + "-volume-pvc";
  const objNamespace = obj.metadata.namespace;
  // read PVC and try to update it
  try {
    const response = await k8sCoreApi.readNamespacedPersistentVolumeClaim(
      `${objName}`,
      `${objNamespace}`
    );
    const newPvc = response.body;
    newPvc.spec.resources.requests.storage = obj.spec.capacity + "Gi";
    k8sCoreApi.replaceNamespacedPersistentVolumeClaim(
      `${objName}`,
      `${objNamespace}`,
      newPvc
    );
    log(`PVC ${objName} was updated!`);
    return;
  } catch (err) {
    log(`Can't read or update ${objName} state...`);
    log(err);
  }
  // create PVC
  try {
    const newpvcTemplate = pvcTemplate(obj);
    k8sCoreApi.createNamespacedPersistentVolumeClaim(
      `${objNamespace}`,
      newpvcTemplate
    );
    log(`PVC ${objName} was created!`);
  } catch (err) {
    log(err);
  }
}

export async function applyDeployment(obj, k8sAppsApi) {
  const objName = obj.metadata.name + "-nfs-server";
  const objNamespace = obj.metadata.namespace;
  // read Deployment
  try {
    const response = await k8sAppsApi.readNamespacedDeployment(
      `${objName}`,
      `${objNamespace}`
    );
    const deployment = response.body;
    log(`Deployment ${objName} already exists!`);
    return;
  } catch (err) {
    log(`Can't read ${objName} state...`);
    log(err);
  }
  // create Deployment
  try {
    const newdeploymentTemplate = nfsDeploymentTemplate(obj);
    k8sAppsApi.createNamespacedDeployment(
      `${objNamespace}`,
      newdeploymentTemplate
    );
    log(`Deployment ${objName} was created!`);
  } catch (err) {
    log(err);
  }
}
