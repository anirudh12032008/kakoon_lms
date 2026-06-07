// PM2 process definition for the Kokoon API.
// Start from the repo root:  pm2 start ecosystem.config.cjs
// The server loads backend/api/.env via dotenv (cwd is backend/api).
module.exports = {
  apps: [
    {
      name: "kokoon-api",
      cwd: "./backend/api",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "350M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
