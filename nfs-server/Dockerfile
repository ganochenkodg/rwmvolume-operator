FROM alpine:3.17

RUN apk add --no-cache --update --verbose nfs-utils bash && \
    rm -rf /var/cache/apk /tmp /sbin/halt /sbin/poweroff /sbin/reboot && \
    mkdir -p /var/lib/nfs/rpc_pipefs /var/lib/nfs/v4recovery && \
    echo "rpc_pipefs    /var/lib/nfs/rpc_pipefs rpc_pipefs      defaults        0       0" >> /etc/fstab && \
    echo "nfsd  /proc/fs/nfsd   nfsd    defaults        0       0" >> /etc/fstab && \
    echo "/export *(rw,fsid=0,async,no_subtree_check,no_auth_nlm,insecure,no_root_squash)" > /etc/exports

COPY entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod +x /usr/bin/entrypoint.sh
WORKDIR /export

EXPOSE 2049 20048

ENTRYPOINT ["/usr/bin/entrypoint.sh"]
