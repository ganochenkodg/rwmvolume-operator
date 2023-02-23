# Creating RWMVolumes

### Prerequisite

The operator includes one custom resource called `RWMVolume`. Install the CRD by running the command below:

```bash
kubectl apply -f https://raw.githubusercontent.com/ganochenkodg/rwmvolume-operator/master/deploy/crds/crd-rwmvolume.yaml
```

You will see the next output:

```console
customresourcedefinition.apiextensions.k8s.io/rwmvolumes.dganochenko.work created
```

Install the operator by running the command below:

```bash
kubectl apply -f https://raw.githubusercontent.com/ganochenkodg/rwmvolume-operator/master/deploy/operator.yaml
```

```console
namespace/rwmvolume-operator created
serviceaccount/rwmvolume-operator-sa created
clusterrole.rbac.authorization.k8s.io/rwmvolume-operator-role created
clusterrolebinding.rbac.authorization.k8s.io/rwmvolume-operator-rolebinding created
deployment.apps/rwmvolume-operator created
```

Check if operator works:

```console
$ kubectl get pod -n rwmvolume-operator
NAME                                  READY   STATUS    RESTARTS   AGE
rwmvolume-operator-6786697b4f-lmh76   1/1     Running   0          59s
$ kubectl logs rwmvolume-operator-6786697b4f-lmh76 -n rwmvolume-operator
2/23/2023, 9:55:35 PM: Watching API
```

### Getting started

Deploy your first RWMVolume resource by running the following command:

```bash
kubectl apply -f https://raw.githubusercontent.com/ganochenkodg/rwmvolume-operator/master/deploy/example/example-rwmvolume.yaml
```

Or you can apply the next YAML directly:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: dganochenko.work/v1alpha1
kind: RWMVolume
metadata:
  name: example-vol
spec:
  storageClassName: standard
  capacity: 2
EOF
```

You will get the next output:

```console
rwmvolume.dganochenko.work/example-vol created
```

Let's check the operator logs and created resources:

```console
$ kubectl logs -f -n rwmvolume-operator rwmvolume-operator-6786697b4f-lmh76
2/23/2023, 9:55:35 PM: Watching API
2/23/2023, 10:06:58 PM: Received event in phase ADDED.
2/23/2023, 10:06:59 PM: Can't read or update example-vol-volume-pvc state...
2/23/2023, 10:06:59 PM: PVC example-vol-volume-pvc was created!
2/23/2023, 10:06:59 PM: Can't read example-vol-nfs-service state...
2/23/2023, 10:06:59 PM: Service example-vol-nfs-service was created!
2/23/2023, 10:06:59 PM: Can't read or update example-vol-nfs-pvc state...
2/23/2023, 10:06:59 PM: PVC example-vol-nfs-pvc was created!
2/23/2023, 10:06:59 PM: Can't read example-vol-nfs-server state...
2/23/2023, 10:06:59 PM: Deployment example-vol-nfs-server was created!
2/23/2023, 10:06:59 PM: Can't read or update example-vol-default-nfs-pv state...
2/23/2023, 10:06:59 PM: PV example-vol-default-nfs-pv was created!
$ kubectl get pv,pvc,deploy,service 
NAME                                                        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                            STORAGECLASS   REASON   AGE
persistentvolume/example-vol-default-nfs-pv                 2Gi        RWX            Delete           Bound    default/example-vol-nfs-pvc                              3m28s
persistentvolume/pvc-f64d7808-7dd9-41f1-af6b-122cc5f200d7   2Gi        RWO            Delete           Bound    default/example-vol-volume-pvc   standard                3m23s

NAME                                           STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
persistentvolumeclaim/example-vol-nfs-pvc      Bound    example-vol-default-nfs-pv                 2Gi        RWX                           3m28s
persistentvolumeclaim/example-vol-volume-pvc   Bound    pvc-f64d7808-7dd9-41f1-af6b-122cc5f200d7   2Gi        RWO            standard       3m28s

NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/example-vol-nfs-server   1/1     1            1           3m28s

NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)              AGE
service/example-vol-nfs-service   ClusterIP   10.4.26.211   <none>        2049/TCP,20048/TCP   3m28s
service/kubernetes                ClusterIP   10.4.16.1     <none>        443/TCP              40m
```

As you can see there are many new entities. You can explore the detailed operator workflow [here](howitworks.md).

Let's try to increase the Volume size:

```console
$ kubectl patch rwmv example-vol --type='merge' -p '{"spec":{"capacity": 3}}' 
rwmvolume.dganochenko.work/example-vol patched
```

The log will show:

```console
2/23/2023, 10:15:27 PM: Received event in phase MODIFIED.
2/23/2023, 10:15:28 PM: PVC example-vol-volume-pvc was updated! You may have to expand Storage FS.
2/23/2023, 10:15:28 PM: Deployment example-vol-nfs-server already exists!
2/23/2023, 10:15:28 PM: Service example-vol-nfs-service already exists!
2/23/2023, 10:15:28 PM: PV example-vol-default-nfs-pv was updated!
2/23/2023, 10:15:28 PM: PVC example-vol-nfs-pvc can't be increased. Only dynamically provisioned pvc can be resized and the storageclass that provisions the pvc must support resize
2/23/2023, 10:15:28 PM: You have to delete the existing PVC when it's not used and re-create it using the next commands:
kubectl delete pvc -n default example-vol-nfs-pvc
cat <<EOF | kubectl apply -f -
{
  "apiVersion": "v1",
  "kind": "PersistentVolumeClaim",
  "metadata": {
    "name": "example-vol-nfs-pvc",
    "namespace": "default"
  },
  "spec": {
    "storageClassName": "",
    "accessModes": [
      "ReadWriteMany"
    ],
    "resources": {
      "requests": {
        "storage": "3Gi"
      }
    },
    "selector": {
      "matchLabels": {
        "name": "example-vol-default-nfs-pv",
        "component": "nfs-server"
      }
    }
  }
}
EOF
```

Let's skip this step and go next. Create the simple deployment, that will use the new RWX Volume.

Use the following command:

```bash
kubectl apply -f https://raw.githubusercontent.com/ganochenkodg/rwmvolume-operator/master/deploy/example/example-deployment.yaml
```

Or apply the YAML directly:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: example-vol-test
spec:
  replicas: 3
  selector:
    matchLabels:
      app: example-vol-test
  template:
    metadata:
      labels:
        app: example-vol-test
    spec:
      containers:
      - name: volume-test
        image: busybox:1.35
        imagePullPolicy: IfNotPresent
        command:
        - sh
        - -c
        - |
          while echo "$(date) - $(hostname)" >> /test/test.log; do
            tail -n 5 /test/test.log
            sleep 5;
          done;
        volumeMounts:
          - mountPath: /test
            name: example-vol-nfs-pvc
      volumes:
        - name: example-vol-nfs-pvc
          persistentVolumeClaim:
            claimName: example-vol-nfs-pvc
EOF
```

Now 3 new pods should be running and using the same volume:

```console
$ kubectl apply -f https://raw.githubusercontent.com/ganochenkodg/rwmvolume-operator/master/deploy/example/example-deployment.yaml
deployment.apps/example-vol-test created
$ kubectl get pod
NAME                                    READY   STATUS    RESTARTS   AGE
example-vol-nfs-server-6b88b446-kdmb2   1/1     Running   0          14m
example-vol-test-7c6fdd57d-5ct2r        1/1     Running   0          8s
example-vol-test-7c6fdd57d-dd4xh        1/1     Running   0          8s
example-vol-test-7c6fdd57d-zscrw        1/1     Running   0          8s
$ kubectl logs example-vol-test-7c6fdd57d-5ct2r| tail -n 10
Thu Feb 23 22:23:23 UTC 2023 - example-vol-test-7c6fdd57d-zscrw
Thu Feb 23 22:23:28 UTC 2023 - example-vol-test-7c6fdd57d-5ct2r
Thu Feb 23 22:23:28 UTC 2023 - example-vol-test-7c6fdd57d-dd4xh
Thu Feb 23 22:23:28 UTC 2023 - example-vol-test-7c6fdd57d-zscrw
Thu Feb 23 22:23:33 UTC 2023 - example-vol-test-7c6fdd57d-5ct2r
Thu Feb 23 22:23:28 UTC 2023 - example-vol-test-7c6fdd57d-zscrw
Thu Feb 23 22:23:33 UTC 2023 - example-vol-test-7c6fdd57d-5ct2r
Thu Feb 23 22:23:33 UTC 2023 - example-vol-test-7c6fdd57d-dd4xh
Thu Feb 23 22:23:33 UTC 2023 - example-vol-test-7c6fdd57d-zscrw
Thu Feb 23 22:23:38 UTC 2023 - example-vol-test-7c6fdd57d-5ct2r
```

When we don't need this volume anymore - we can remove the RWMVolume resource:

```console
$ kubectl delete deploy example-vol-test
deployment.apps "example-vol-test" deleted
$ kubectl delete rwmvolume example-vol
rwmvolume.dganochenko.work "example-vol" deleted
$ kubectl logs -n rwmvolume-operator rwmvolume-operator-6786697b4f-lmh76 | tail -n 2
2/23/2023, 10:25:22 PM: Received event in phase DELETED.
2/23/2023, 10:25:22 PM: Deleted example-vol
$ kubectl get pv,pvc,deploy,service
NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.4.16.1    <none>        443/TCP   56m
```

