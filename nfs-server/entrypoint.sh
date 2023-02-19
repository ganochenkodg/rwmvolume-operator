#!/bin/bash

trap "stop; exit 0;" SIGTERM SIGINT

stop()
{
  echo "SIGTERM caught, terminating NFS process(es)..."
  /usr/sbin/exportfs -uav
  /usr/sbin/rpc.nfsd 0
  pid1=`pidof rpc.nfsd`
  pid2=`pidof rpc.mountd`
  pid3=`pidof rpcbind`
  kill -TERM $pid1 $pid2 $pid3 > /dev/null 2>&1
  echo "Terminated."
  exit
}

set -uo pipefail

chmod 777 /export

while true; do
  pid=`pidof rpc.mountd`
  while [ -z "$pid" ]; do
    echo "Displaying /etc/exports contents:"
    cat /etc/exports
    echo ""

    echo "Starting rpcbind..."
    /sbin/rpcbind -w
    echo "Displaying rpcbind status..."
    /sbin/rpcinfo

    echo "Starting NFS in the background..."
    /usr/sbin/rpc.nfsd --debug 8 --no-udp --no-nfs-version 3
    echo "Exporting File System..."
    if /usr/sbin/exportfs -rv; then
      /usr/sbin/exportfs
    else
      echo "Export validation failed, exiting..."
      exit 1
    fi
    echo "Starting Mountd in the background..."These
    /usr/sbin/rpc.mountd --debug all --no-udp --no-nfs-version 2 --no-nfs-version 3
    pid=`pidof rpc.mountd`

    if [ -z "$pid" ]; then
      echo "Startup of NFS failed, sleeping for 2s, then retrying..."
      sleep 2
    fi
  done

  echo "Startup successful."
  break
done

while true; do

  pid=`pidof rpc.mountd`
  if [ -z "$pid" ]; then
    echo "NFS has failed, exiting..."
    break
  fi

  sleep 1
done

sleep 1
exit 1
