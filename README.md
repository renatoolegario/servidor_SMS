# docker_servidor_sms

sudo apt update
sudo apt upgrade
sudo apt install git
sudo apt install npm
npm install pm2 -g
npx playwright install
npx playwright install-deps
sudo apt install nginx
sudo killall apache2
sudo apt install python3-certbot-nginx
sudo nginx -t
sudo service nginx restart
sudo apt update
sudo apt upgrade
sudo rm -rf /etc/nginx/sites-enabled/default
sudo rm -rf /etc/nginx/sites-available/default
sudo ln -s /etc/nginx/sites-available/servidorSMS /etc/nginx/sites-enabled

nginx
```
server {
  server_name sms.falauai.com.br;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
```


# Documentação

Sinal para nova conexão de API 
/api/qrcode/[conexao]

