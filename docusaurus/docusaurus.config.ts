import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Documentation Portal',
  tagline: 'Centralized documentation for all projects',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: process.env.DOCS_URL || 'http://localhost:3000',
  baseUrl: '/',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: false,  // Disable blog feature
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Docs Portal',
      logo: {
        alt: 'Docs Portal Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'general/welcome',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'dropdown',
          label: 'Projects',
          position: 'left',
          items: [
            {
              label: 'Infrastructure',
              to: '/docs/infrastructure/README',
            },
            {
              label: 'EduHub',
              to: '/docs/eduhub/README',
            },
            {
              label: 'Blog',
              to: '/docs/blog/README',
            },
          ],
        },
        {
          href: '/auth/logout',
          label: 'Logout',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'General',
              to: '/docs/general/welcome',
            },
            {
              label: 'Infrastructure',
              to: '/docs/infrastructure/README',
            },
          ],
        },
        {
          title: 'Projects',
          items: [
            {
              label: 'EduHub',
              to: '/docs/eduhub/README',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Documentation Portal.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'nginx', 'sql', 'yaml', 'docker'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
