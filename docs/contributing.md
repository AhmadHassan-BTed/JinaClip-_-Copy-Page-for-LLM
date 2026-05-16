# Contributing to JinaClip

First off, thank you for considering contributing to the official Jina Reader extension!

## Development Setup

1. Fork the repository and clone it locally.
2. The extension is located in the `extension/` directory.
3. Install development dependencies (for linting and formatting):
   ```bash
   npm install
   ```
4. Load the `extension/` folder as an unpacked extension in Chrome.

## Coding Standards

- **Modularity:** Keep logic in services and utilities. Avoid adding business logic to the `background/index.js` or `options.js`.
- **Naming:** Use PascalCase for Services (e.g., `JinaApiService`) and camelCase for functions and variables.
- **Async/Await:** Use modern async/await patterns for all asynchronous operations.
- **Linting:** Run `npm run lint` before submitting a PR.
- **Formatting:** We use Prettier. Run `npm run format` to ensure consistency.

## Pull Request Process

1. Create a feature branch.
2. Ensure your code follows the existing architectural patterns.
3. Update documentation if you are adding a new feature or header support.
4. Submit your PR against the `main` branch of the `jina-ai/reader` repository.

## Adding New Jina Headers

If Jina Reader adds a new header:
1. Update `src/config/defaultSettings.js` to include the new field.
2. Update `src/services/jinaApi.js` to map that field to a header.
3. Add a corresponding field in `src/options/options.html`.
4. (Optional) Add a shortcut in the context menu via `src/config/constants.js`.
