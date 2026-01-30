# Frontend Configuration

## API URL Configuration

The frontend automatically detects the environment and configures the API URL accordingly:

### Development Environment
- **Detection**: When `window.location.hostname` is `localhost` or `127.0.0.1`
- **API URL**: `http://localhost:3000/api/planes`

### Production Environment
- **Detection**: Any hostname other than localhost or 127.0.0.1
- **Default API URL**: `https://metal-birds-watch-backend.up.railway.app/api/planes`
- **Custom Configuration**: Set `window.ENV_API_URL` before loading `config.js`

### Notes
- The `file://` protocol is not supported due to CORS restrictions. Always test via HTTP server (e.g., `python -m http.server` or `npx serve`).

## Customizing Production API URL

There are two ways to customize the production API URL:

### Option 1: Set Global Variable (Recommended)
Add this script before loading `config.js` in `index.html`:

```html
<script>
  window.ENV_API_URL = 'https://your-backend-url.com/api/planes';
</script>
<script src="js/config.js"></script>
```

### Option 2: Build-Time Replacement
Use a build tool to replace the default URL in `config.js`:

```bash
# Example using sed
sed -i "s|https://metal-birds-watch-backend.up.railway.app|https://your-backend-url.com|g" frontend/js/config.js
```

## Environment Variables

The frontend doesn't use traditional environment variables since it's a static site. However, you can:

1. Use a build step to inject values
2. Set `window.ENV_API_URL` in a separate `env.js` file
3. Use URL query parameters (not recommended for production)

## Deployment Checklist

- [ ] Ensure backend URL is accessible from the frontend domain
- [ ] Update CORS settings in backend to allow frontend domain
- [ ] Test API connectivity after deployment
- [ ] Verify API URL is not hardcoded to localhost in production
