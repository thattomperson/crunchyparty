// import * as Sentry from '@sentry/browser';

// Sentry.init({
//     dsn: process.env.SENTRY_DSN,
//     release: process.env.SOURCE_VERSION,
// });

const target = document.createElement('div')
document.body.appendChild(target)

import React from 'react';
import { render } from 'react-dom';
import Sidebar  from './Sidebar'
import { Socket } from '@ws/client'

const ws = new Socket('wss://crunchyparty.herokuapp.com')

render(<Sidebar ws={ws}/>, target);
  