export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Nejah Online Quran Center — This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <link rel="icon" type="image/png" href="/logo.png" />
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; }
      .logo { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 2rem; }
      .logo-icon { width: 2.5rem; height: 2.5rem; background: #059669; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 1.25rem; }
      .logo-text { font-size: 1.125rem; font-weight: 700; color: #111827; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; color: #111827; }
      p { color: #6b7280; margin: 0 0 1.5rem; line-height: 1.6; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.625rem 1.25rem; border-radius: 0.5rem; font: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: background 0.15s, border-color 0.15s; }
      .primary { background: #059669; color: #fff; }
      .primary:hover { background: #047857; }
      .secondary { background: #fff; color: #374151; border-color: #d1d5db; }
      .secondary:hover { border-color: #9ca3af; background: #f9fafb; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="logo">
        <div class="logo-icon">ن</div>
        <span class="logo-text">Nejah Center</span>
      </div>
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
