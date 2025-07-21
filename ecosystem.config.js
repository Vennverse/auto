module.exports = {
  apps: [
    {
      name: 'autojobr',
      script: 'server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      node_args: [
        '--max-old-space-size=1024',
        '--enable-source-maps'
      ],
      
      // Monitoring
      monitoring: true,
      pmx: true,
      
      // Auto restart configuration
      min_uptime: '10s',
      max_restarts: 10,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Health check
      health_check_grace_period: 3000,
      
      // Advanced PM2 features
      increment_var: 'PORT',
      
      // Process management
      autorestart: true,
      max_memory_restart: '1G',
      
      // Cluster configuration
      instance_var: 'INSTANCE_ID',
      
      // Log rotation
      log_type: 'json',
      
      // Environment variables
      env_file: '.env.production'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/autojobr.git',
      path: '/var/www/autojobr',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};