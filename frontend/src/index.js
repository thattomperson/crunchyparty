import Sidebar from './Sidebar.svelte'

const target = document.createElement('div')
document.body.appendChild(target)

new Sidebar({ target })