import { log } from "./index.js";
import {
  pvcTemplate,
  nfsDeploymentTemplate,
  nfsServiceTemplate,
  nfsPvTemplate,
  nfsPvcTemplate
} from "./templates.js";

export async function deleteResource(obj, k8sCoreApi, k8sAppsApi) {
  log(`Deleted ${obj.metadata.name}`);
  k8sCoreApi.deleteNamespacedPersistentVolumeClaim(
    `${obj.metadata.name}-nfs-pvc`,
    `${obj.metadata.namespace}`
  );
  k8sCoreApi.deletePersistentVolume(
    `${obj.metadata.name}-${obj.metadata.namespace}-nfs-pv`
  );
  k8sCoreApi.deleteNamespacedService(
    `${obj.metadata.name}-nfs-service`,
    `${obj.metadata.namespace}`
  );
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
  try {
    const response = await k8sCoreApi.readNamespacedPersistentVolumeClaim(
      `${objName}`,
      `${objNamespace}`
    );
    const newPvc = response.body;
    const currentCapacity = newPvc.spec.resources.requests.storage.replace(
      /[^0-9]/g,
      ""
    );
    if (currentCapacity < obj.spec.capacity) {
      newPvc.spec.resources.requests.storage = obj.spec.capacity + "Gi";
      k8sCoreApi.replaceNamespacedPersistentVolumeClaim(
        `${objName}`,
        `${objNamespace}`,
        newPvc
      );
      log(`PVC ${objName} was updated! You may have to expand Storage FS.`);
    } else {
      log(`PVC ${objName} capacity can only be increased!`);
    }
    return;
  } catch (err) {
    log(`Can't read or update ${objName} state...`);
  }
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

export async function applyNfsPvc(obj, k8sCoreApi) {
  const objName = obj.metadata.name + "-nfs-pvc";
  const objNamespace = obj.metadata.namespace;
  try {
    const response = await k8sCoreApi.readNamespacedPersistentVolumeClaim(
      `${objName}`,
      `${objNamespace}`
    );
    const newNfsPvc = response.body;
    const currentCapacity = newNfsPvc.spec.resources.requests.storage.replace(
      /[^0-9]/g,
      ""
    );
    if (currentCapacity < obj.spec.capacity) {
      log(
        `PVC ${objName} can't be increased. Only dynamically provisioned pvc can be resized and the storageclass that provisions the pvc must support resize`
      );
      log(
        "You have to delete the existing PVC when it's not used and re-create it using the next commands:"
      );
      console.log(`kubectl delete pvc -n ${objNamespace} ${objName}`);
      console.log("cat <<EOF | kubectl apply -f -");
      console.log(JSON.stringify(nfsPvcTemplate(obj), null, 2));
      console.log("EOF");
    } else {
      log(`PVC ${objName} capacity can only be increased!`);
    }
    return;
  } catch (err) {
    log(`Can't read or update ${objName} state...`);
  }
  try {
    const newpvcTemplate = nfsPvcTemplate(obj);
    k8sCoreApi.createNamespacedPersistentVolumeClaim(
      `${objNamespace}`,
      newpvcTemplate
    );
    log(`PVC ${objName} was created!`);
  } catch (err) {
    log(err);
  }
}

export async function applyNfsPv(obj, k8sCoreApi) {
  const objName = obj.metadata.name + "-" + obj.metadata.namespace + "-nfs-pv";
  try {
    const response = await k8sCoreApi.readPersistentVolume(`${objName}`);
    const newNfspv = response.body;
    const currentCapacity = newNfspv.spec.capacity.storage.replace(
      /[^0-9]/g,
      ""
    );
    if (currentCapacity < obj.spec.capacity) {
      newNfspv.spec.capacity.storage = obj.spec.capacity + "Gi";
      k8sCoreApi.replacePersistentVolume(`${objName}`, newNfspv);
      log(`PV ${objName} was updated!`);
    } else {
      log(`PV ${objName} capacity can only be increased!`);
    }
    return;
  } catch (err) {
    log(`Can't read or update ${objName} state...`);
  }
  try {
    const newnfspvTemplate = nfsPvTemplate(obj);
    k8sCoreApi.createPersistentVolume(newnfspvTemplate);
    log(`PV ${objName} was created!`);
  } catch (err) {
    log(err);
  }
}

export async function applyDeployment(obj, k8sAppsApi) {
  const objName = obj.metadata.name + "-nfs-server";
  const objNamespace = obj.metadata.namespace;
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
  }
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

export async function applyService(obj, k8sCoreApi) {
  const objName = obj.metadata.name + "-nfs-service";
  const objNamespace = obj.metadata.namespace;
  try {
    const response = await k8sCoreApi.readNamespacedService(
      `${objName}`,
      `${objNamespace}`
    );
    const service = response.body;
    log(`Service ${objName} already exists!`);
    return;
  } catch (err) {
    log(`Can't read ${objName} state...`);
  }
  try {
    const newserviceTemplate = nfsServiceTemplate(obj);
    k8sCoreApi.createNamespacedService(`${objNamespace}`, newserviceTemplate);
    log(`Service ${objName} was created!`);
  } catch (err) {
    log(err);
  }
}
