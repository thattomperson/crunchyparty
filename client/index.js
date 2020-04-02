import * as Sentry from '@sentry/browser';
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: process.env.SOURCE_VERSION,
    beforeSend(event) {
        console.log(event)
        return event
    }
});

import './styles.module.css'
import Sidebar from './Sidebar.svelte'

const target = document.createElement('div')
document.body.appendChild(target)

new Sidebar({ target })
