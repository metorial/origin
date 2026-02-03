import type { ScmBackend } from '../../../prisma/generated/client';

export let installationSessionHtml = (d: {
  sessionId: string;
  backends: Array<{
    id: string;
    type: string;
    name: string;
    description: string | null;
    isDefault: boolean;
  }>;
}) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Connect Repository Provider - Metorial</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f7;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
      padding: 32px;
      max-width: 500px;
      width: 100%;
    }

    .logo {
      width: 40px;
      height: 40px;
      margin: 0 auto 24px;
      display: block;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      text-align: center;
      color: #1d1d1f;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 14px;
      color: #86868b;
      text-align: center;
      margin-bottom: 32px;
    }

    .backends {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .backend-button {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 1px solid #d2d2d7;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      color: inherit;
    }

    .backend-button:hover {
      border-color: #0066cc;
      background: #f5f9ff;
    }

    .backend-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #f5f5f7;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      font-size: 14px;
    }

    .backend-info {
      flex: 1;
    }

    .backend-name {
      font-size: 15px;
      font-weight: 500;
      color: #1d1d1f;
      margin-bottom: 2px;
    }

    .backend-description {
      font-size: 13px;
      color: #86868b;
    }

    .backend-badge {
      font-size: 11px;
      padding: 2px 8px;
      background: #e8e8ed;
      border-radius: 4px;
      color: #6e6e73;
      margin-left: 8px;
    }

    .divider {
      height: 1px;
      background: #d2d2d7;
      margin: 24px 0;
    }

    .create-backend-button {
      display: block;
      width: 100%;
      padding: 12px;
      background: white;
      border: 1px solid #d2d2d7;
      border-radius: 8px;
      font-size: 15px;
      color: #0066cc;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      text-decoration: none;
    }

    .create-backend-button:hover {
      background: #f5f9ff;
      border-color: #0066cc;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="https://cdn.metorial.com/2025-06-13--14-59-55/logos/metorial/primary_logo/raw.svg" alt="Metorial" class="logo" />

    <h1>Connect Repository Provider</h1>
    <p class="subtitle">Choose a provider to connect your repositories</p>

    <div class="backends">
      ${d.backends.map(backend => `
        <a href="/origin/scm/installation-session/${d.sessionId}/select-backend/${backend.id}" class="backend-button">
          <div class="backend-icon">${getBackendIcon(backend.type)}</div>
          <div class="backend-info">
            <div class="backend-name">
              ${backend.name}
              ${backend.isDefault ? '<span class="backend-badge">Default</span>' : ''}
            </div>
            ${backend.description ? `<div class="backend-description">${backend.description}</div>` : ''}
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="#86868b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      `).join('')}
    </div>

    <div class="divider"></div>

    <a href="/origin/scm/installation-session/${d.sessionId}/setup-backend" class="create-backend-button">
      + Add Custom Provider
    </a>
  </div>

  <script>
    function getBackendIcon(type) {
      const icons = {
        'github': '\u{1F41B}',
        'github_enterprise': '\u{1F3E2}',
        'gitlab': '\u{1F98A}',
        'gitlab_selfhosted': '\u{1F6E0}'
      };
      return icons[type] || '\u{1F4E6}';
    }
  </script>
</body>
</html>`;

function getBackendIcon(type: string): string {
  const icons: Record<string, string> = {
    github: '🐛',
    github_enterprise: '🏢',
    gitlab: '🦊',
    gitlab_selfhosted: '🛠'
  };
  return icons[type] || '📦';
}
