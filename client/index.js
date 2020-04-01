import * as Sentry from '@sentry/browser';
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: process.env.SOURCE_VERSION,
});

import './styles.module.css'
import Sidebar from './Sidebar.svelte'

const target = document.createElement('div')
document.body.appendChild(target)

new Sidebar({ target })
