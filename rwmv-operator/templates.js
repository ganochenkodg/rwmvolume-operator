export function pvcTemplate(apiObj) {
  var template = {
    kind: 'PersistentVolumeClaim',
    apiVersion: 'v1',
    metadata: {
      name: `${apiObj.metadata.name}-volume-pvc`,
      namespace: `${apiObj.metadata.name}`
    },
    spec: {
      storageClassName: `${apiObj.spec.storageClassName}`,
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: {
          storage: `${apiObj.spec.capacity}Gi`
        }
      }
    }
  };
  return template;
}
