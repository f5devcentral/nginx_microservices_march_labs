# Instruction to Setup a UDF Host
F5's Unified Demo Framework (UDF) is a tool leveraged by F5 to provide training to F5 employees, employees and customers.  For this set of labs, we need an Ubuntu server with 6vCPUs, 24GB of memory.

## Install VSCode
To help the students use an IDE instead of the CLI we will install the [Coder server](https://github.com/coder/code-server) which provides VS Code in a browser. 

Run the following commands as the `ubuntu` user:
```bash
# Setup config file
mkdir -p ~/.config/code-server
cat > ~/.config/code-server/config.yaml <<EOL
bind-addr: 0.0.0.0:8080
auth: none
cert: false
EOL

# Install code-server
curl -fOL https://github.com/coder/code-server/releases/download/v$VERSION/code-server_$VERSION_amd64.deb
sudo dpkg -i code-server_$VERSION_amd64.deb
sudo systemctl enable --now code-server@$USER
```

Now create a UDF Access Method for VS Code:
| Attribute  | Value |
|---|---|
| Label  | VSCode  |
| Protocol  | HTTPS  |
| Instance Address  | 10.1.1.4 (or your IP address if different)  |
| Instance Port | 8080 |

## CoreDNS
To publish our K8s ingress resources we need Firefox to query a local DNS server that points the example.local domain to our NGINX ingress.

```bash
# Setup config files
mkdir -p /home/ubuntu/.config/coredns
cat > /home/ubuntu/.config/coredns/Corefile <<EOL
.:53 {
    forward . 8.8.8.8
    log
    errors
}

example.local:53 {
  file /root/example.local
  log
  errors
}
EOL
cat > /home/ubuntu/.config/coredns/example.local <<EOL
\$ORIGIN example.local.
\$TTL 1h

@                   IN  SOA     ns.example.local. admin.example.local. (
                                    2022030704     ; Serial
                                    1d             ; Refresh
                                    2h             ; Retry
                                    4w             ; Expire
                                    1h)            ; Minimum TTL
@                   IN  A       10.1.1.4
@                   IN  NS      ns.example.local.
.                   IN  CNAME   @
*                   IN  CNAME   @
ns                  IN  CNAME   @
EOL

# Start Docker container
sudo docker run -d \
    --restart always \
    --name coredns \
    --volume=/home/ubuntu/.config/coredns/:/root/ \
    -p 10.1.1.4:53:53/tcp \
    -p 10.1.1.4:53:53/udp \
    coredns/coredns \
    -conf /root/Corefile

# Configure systemd-resolve
sudo systemd-resolve --interface ens5 --set-dns 10.1.1.4 --set-domain example.local
sudo service systemd-resolved restart
```

## Configure NGINX Reverse Proxy
Since minikube starts the ingress services on a random port we can configure NGINX proxy_pass to make it easier for the student.

```bash
sudo tee -a /etc/nginx/sites-available/example.local << EOL
server {
    listen 80;
    server_name example.local *.example.local;
    location / {
        proxy_pass http://192.168.49.2:31987;
        proxy_set_header Host \$host;
    }
}
EOL

sudo ln -s /etc/nginx/sites-available/example.local /etc/nginx/sites-enabled/example.local 

sudo systemctl restart nginx
```

## Install Firefox Browser
To help test ingress resources we need to install [Firefox in a Docker container](https://github.com/jlesage/docker-firefox).

```bash
sudo docker run -d \
    --restart always \
    --name=firefox \
    -p 5800:5800 \
    --dns 10.1.1.4 \
    -v /docker/appdata/firefox:/config:rw \
    --shm-size 2g \
    jlesage/firefox
```

# UDF Access Method
Now create a UDF Access Method for Firefox:
| Attribute  | Value |
|---|---|
| Label  | Firefox  |
| Protocol  | HTTPS  |
| Instance Address  | 10.1.1.4 (or your IP address if different)  |
| Instance Port | 5800 |


