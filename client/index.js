import * as Sentry from '@sentry/browser';
Sentry.init({ dsn: process.env.SENTRY_DSN });

import './styles.module.css'
import Sidebar from './Sidebar.svelte'

const target = document.createElement('div')
document.body.appendChild(target)

new Sidebar({ target })
