module.exports = {
  apps: [
    {
      name: "google-messages-next",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};