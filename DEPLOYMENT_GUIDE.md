# Deployment Guide - Authentication Update

## Quick Start (Docker)

To deploy the new authentication system, run these commands:

```bash
# Stop current containers
docker-compose down

# Rebuild with new dependencies
docker-compose build --no-cache

# Start the services
docker-compose up -d

# Check logs to ensure everything started correctly
docker-compose logs -f app
```

## What Happens During Deployment

1. **Docker rebuilds** the app container with the new `cookie-session` dependency
2. **Database migrations** run automatically when the app starts:
   - Updates `users` table to add `email` and `password` columns
   - Creates new `notifications` table
   - Creates index on `notifications.user_id`
3. **Services start** in this order:
   - PostgreSQL (with health check)
   - Neo4j (with health check)
   - Rayu app (after databases are healthy)

## Verify Deployment

1. **Check app is running:**
   ```bash
   docker-compose ps
   ```
   All services should show "Up" status

2. **Test the authentication:**
   - Open http://localhost:8080
   - Click "Registrarse" (Sign up)
   - Create an account with email, password, and nickname
   - You should see your user icon in the top-right corner

3. **Test notifications:**
   - Create a story while logged in
   - Log out and create another account
   - Add a chapter to the first user's story
   - Log back in as the first user
   - Check the notification badge and inbox

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs app

# Common issues:
# - Database not ready: Wait a few seconds and check again
# - Port already in use: Change port in docker-compose.yml
```

### Database migration issues
```bash
# Connect to PostgreSQL and check tables
docker exec -it rayu-postgres psql -U postgres -d rayu

# List tables
\dt

# Check users table structure
\d users

# Check notifications table
\d notifications

# Exit
\q
```

### Reset everything (CAUTION: Deletes all data)
```bash
docker-compose down -v
docker-compose up -d
```

## Production Considerations

### Security
1. **Change SESSION_SECRET** in `docker-compose.yml` to a strong random string:
   ```yaml
   SESSION_SECRET: your-very-secure-random-string-here
   ```

2. **Use environment files** instead of hardcoded values:
   ```yaml
   env_file:
     - .env.production
   ```

3. **Consider bcrypt** for password hashing (currently using SHA-256)

### Performance
- Session cookies are set to expire after 30 days
- Notifications are indexed by `user_id` for fast queries
- Consider adding pagination for notifications if users have many

### Monitoring
```bash
# Watch logs in real-time
docker-compose logs -f app

# Check resource usage
docker stats rayu-app rayu-postgres rayu-neo4j
```

## Rollback Plan

If you need to rollback:

```bash
# Stop containers
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

Note: Database schema changes are backward compatible. Old data will remain intact.
