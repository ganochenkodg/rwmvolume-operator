![rwmv_logo](resources/logo.png)

# RWMVolume Operator

`RWMVolume Operator` eases the pain of creating ReadWriteMany Volumes in cloud environments. 
The operator creates a volume with a chosen storage class and deploys NFS server and ReadWriteMany volume over him. 
Block storages, available as storage classes in popular clouds (for example, 
[GCP](https://cloud.google.com/kubernetes-engine/docs/how-to/persistent-volumes/gce-pd-csi-driver#create_a_storageclass) or 
[AWS](https://docs.aws.amazon.com/eks/latest/userguide/storage-classes.html)), allow you to create volumes working in ReadWriteOnce and ReadOnlyMany modes. 
This operator makes them "work" in RWX mode if you need a writable volume accessible by many pods.

## Features

RWMVolume Operator provides following features:

* Create/Delete Volumes and all required environment by creating `RWMVolume` custom resource.
* Extending the Volume size by changing the `.spec.capacity` field in the `RWMVolume` resource.

## Documentations

* [How it works](docs/howitworks.md) - a general overview and definitions
* [Creating Volumes](docs/creatingvolumes.md) - make a dynamically provisioned volume and a test deployment

## Quickstart

### Installing the CRD

The operator includes one custom resource called `RWMVolume`. Install the CRD by running the command below:

```bash
kubectl apply -f https://raw.githubusercontent.com/ganochenkodg/rwmvolume-operator/master/deploy/crds/crd-rwmvolume.yaml
```

### Deploying the operator

Install the operator by running the command below:

```bash
kubectl apply -f https://raw.githubusercontent.com/ganochenkodg/rwmvolume-operator/master/deploy/operator.yaml
```

## Usage

The example is available in `deploy/example`, it creates a volume and a deployment with 3 replicas to work with.

