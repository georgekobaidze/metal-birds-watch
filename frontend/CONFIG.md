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

## GitHub Pages Deployment

### Automatic Deployment

A GitHub Actions workflow is included at `.github/workflows/deploy.yml` that automatically deploys the frontend to GitHub Pages when you push to the `feature/front-end-backbone` branch.

**To enable GitHub Pages:**
1. Go to repository Settings → Pages
2. Source: Select "GitHub Actions" as the deployment source
3. The workflow will automatically deploy on the next push

**The workflow:**
- ✅ Deploys the `frontend/` directory to GitHub Pages
- ✅ Works with the default backend URL (Railway)
- ✅ Can inject custom backend URL via repository secrets (optional)

### Custom Backend URL with GitHub Actions

To use a custom backend URL in GitHub Pages:

1. **Add a repository secret:**
   - Go to Settings → Secrets and variables → Actions
   - Create a new secret: `BACKEND_URL` with your backend URL

2. **Uncomment the injection step in `.github/workflows/deploy.yml`:**
   ```yaml
   - name: Inject backend URL (optional)
     run: |
       echo "window.ENV_API_URL = '${{ secrets.BACKEND_URL }}';" > frontend/env.js
   ```

3. **Load the env.js file in `index.html` before `config.js`:**
   ```html
   <script src="env.js"></script>
   <script src="js/config.js"></script>
   ```

## Deployment Checklist

- [ ] Ensure backend URL is accessible from the frontend domain
- [ ] Update CORS settings in backend to allow frontend domain
- [ ] Test API connectivity after deployment
- [ ] Verify API URL is not hardcoded to localhost in production
- [ ] Enable GitHub Pages in repository settings (if using GitHub Pages)
- [ ] Configure repository secrets for custom backend URL (if needed)
