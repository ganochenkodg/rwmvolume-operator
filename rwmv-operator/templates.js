export function pvcTemplate(apiObj) {
  var template = {
    apiVersion: "v1",
    kind: "PersistentVolumeClaim",
    metadata: {
      name: `${apiObj.metadata.name}-volume-pvc`,
      namespace: `${apiObj.metadata.namespace}`
    },
    spec: {
      storageClassName: `${apiObj.spec.storageClassName}`,
      accessModes: ["ReadWriteOnce"],
      resources: {
        requests: {
          storage: `${apiObj.spec.capacity}Gi`
        }
      }
    }
  };
  return template;
}

export function nfsDeploymentTemplate(apiObj) {
  var template = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: `${apiObj.metadata.name}-nfs-server`,
      namespace: `${apiObj.metadata.namespace}`,
      labels: {
        name: `${apiObj.metadata.name}-nfs-server`,
        component: "nfs-server"
      },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          name: `${apiObj.metadata.name}-nfs-server`,
          component: "nfs-server"
        }
      },
      template: {
        metadata: {
          labels: {
            name: `${apiObj.metadata.name}-nfs-server`,
            component: "nfs-server"
          }
        },
        spec: {
          containers: [
            {
            name: `${apiObj.metadata.name}-nfs-server`,
            image: "docker.io/dganochenko/nfs-server:latest",
            ports: [
              {
              name: "nfs",
              containerPort: 2049
              },
              {
              name: "mountd",
              containerPort: 20048
              }
            ],
            securityContext: {
              privileged: true
            },
            volumeMounts: [
              {
              mountPath: "/export",
              name: `${apiObj.metadata.name}-volume-pvc`
              }
            ]
            }
          ],
          volumes: [
            {
            name: `${apiObj.metadata.name}-volume-pvc`,
              persistentVolumeClaim: {
                claimName: `${apiObj.metadata.name}-volume-pvc`
              }
            }
          ]
        }
      }
    }
  };
  return template;
}
