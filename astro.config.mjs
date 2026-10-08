// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';

// The design mockups live in public/mockups/ so `npm run dev` serves them at
// http://localhost:4321/mockups/. This integration removes them again after every build,
// so they never end up on the live site.
/** @type {import('astro').AstroIntegration} */
const devOnlyMockups = {
  name: 'dev-only-mockups',
  hooks: {
    // Dev server: /mockups and /mockups/ open the switcher page.
    'astro:server:setup': ({ server }) => {
      server.middlewares.stack.unshift({
        route: '',
        handle: (req, res, next) => {
          const url = (req.url || '').split('?')[0];
          if (url !== '/mockups' && url !== '/mockups/') return next();
          res.writeHead(302, { Location: '/mockups/index.html' });
          res.end();
        },
      });
    },
    'astro:build:done': ({ dir, logger }) => {
      fs.rmSync(new URL('mockups/', dir), { recursive: true, force: true });
      logger.info('Removed mockups/ from the build output');
    },
  },
};

export default defineConfig({
  // Change this if the domain ever changes.
  site: 'https://www.sigridruttyn.be',
  integrations: [devOnlyMockups],
});
