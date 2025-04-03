module.exports = {
  apps: [
    {
      name: "google-messages-next",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
    },
  ],
};
