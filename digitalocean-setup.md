# DAO News **[server]**

<div align="center">
 <img src="https://idn.dao-news.com/asset/logo/white.png?width=1024" width="340" />
</div>

<br />
<br />

## 📡 Deployment

<br />

| OS            | Memory  | Disk     |
| :------------ | :------ | :------- |
| Debian 11 x64 | >= 2 GB | >= 50 GB |

<br />

#### **🧰 [ initial ]**

```bash
apt update
apt upgrade
apt install curl git vim htop build-essential apt-transport-https zsh ufw nginx certbot python3-certbot-nginx
```

<br />

#### **🖌 [ oh-my-zsh ]**

```bash
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
ZSH_THEME="rkj-repos"
ZSH_THEME="candy"
```

<br />

#### **🔑 [ ssh ]**

```bash
ssh-copy-id username@hostname
vim /etc/ssh/sshd_config
```

Uncomment the line `#PubkeyAuthentication yes` if it is commented out. This enables SSH key-based authentication.

```bash
service ssh restart
```

#### **🛡 [ nginx ]**

```bash
ufw enable && ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw status
systemctl status nginx && systemctl start nginx && systemctl enable nginx
```

- `systemctl reload nginx`
- `systemctl restart nginx`

<br />

#### **🔒 [ letsencrypt ]**

```bash
server_name example.com;
```

```bash
nginx -t
systemctl reload nginx
certbot --nginx -d example.com
```

```bash
server {
    server_name example.com; # managed by Certbot

	location / {
		proxy_pass http://localhost:3000;
	}

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = example.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    server_name example.com;

	listen 80;
	listen [::]:80;

	return 404; # managed by Certbot
}
```

```bash
nginx -t
systemctl reload nginx
```

<br />

#### **⚙️ [ node 18 ]**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install nodejs
node -v
```

<br />

#### **🔧 [ yarn ]**

```bash
npm install -g yarn
yarn --version
```

<br />

#### **⚖️ [ pm2 ]**

```bash
npm install pm2@latest -g
```

<br />

#### **🪪 [ redis ]**

```bash
apt install redis-server
systemctl restart redis.service
systemctl status redis
redis-cli
```

<br />

#### **🗂 [ mongodb ]**

```bash
echo "deb http://repo.mongodb.org/apt/debian bullseye/mongodb-org/5.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
curl -sSL https://www.mongodb.org/static/pgp/server-5.0.asc  -o mongoserver.asc
apt update
sudo wget -O- https://www.mongodb.org/static/pgp/server-5.0.asc | gpg --dearmor | sudo tee /usr/share/keyrings/mongodb.gpg
echo 'deb [signed-by=/usr/share/keyrings/mongodb.gpg] http://repo.mongodb.org/apt/debian buster/mongodb-org/5.0 main' | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
apt update
apt install mongodb-org
systemctl enable --now mongod
systemctl status mongod
mongo
```

<br />

#### **🖇 [ doppler ]**

```bash
apt install ca-certificates gnupg
curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | sudo apt-key add -
echo "deb https://packages.doppler.com/public/cli/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/doppler-cli.list
apt update
apt install doppler
doppler --version
```

```bash
doppler configure set token dp.st.prd.xxxx --scope ./your-app
```

> ⚠️ _Security measure by removing the Service Token value from bash histor_ ⚠️

```bash
history -c
```

<br />

#### **🚨 [ vigil ]**

```bash
wget https://github.com/valeriansaliou/vigil/releases/download/v1.24.3/v1.24.3-x86_64.tar.gz
tar -xvzf v1.24.3-x86_64.tar.gz

=> /opt/vigil/
```

```bash
chmod +x vigil
vim /etc/systemd/system/vigil.service
```

```bash
[Unit]
Description=Vigil Microservices Status Page
After=network.target

[Service]
Type=simple
ExecStartPre=/sbin/setcap 'cap_net_raw+ep' /opt/vigil/vigil
ExecStart=/opt/vigil/vigil -c /opt/vigil/config.cfg
Restart=on-failure
PermissionsStartOnly=true

[Install]
WantedBy=multi-user.target
```

- `systemctl daemon-reload`
- `systemctl start vigil.service`
- `systemctl restart vigil.service`
- `systemctl status vigil.service`
  <br />
