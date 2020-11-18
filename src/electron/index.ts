import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Menu,
} from 'electron'
import path from 'path'
import url from 'url'
import { template } from './menu'
import { dev } from './consts'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null = null
const MAC = process.platform === 'darwin'

// single instance lock
const singleInstance = app.requestSingleInstanceLock()

function createMainWindow() {
  const windowOptions: BrowserWindowConstructorOptions = {
    webPreferences: {
      nodeIntegration: true,
      webSecurity: !dev,
      webviewTag: true,
      enableRemoteModule: true,
      preload: dev
        ? path.join(app.getAppPath(), '../static/main-preload.js')
        : path.join(app.getAppPath(), './compiled/app/static/main-preload.js'),
    },
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 630,
  }
  if (process.platform === 'darwin') {
    windowOptions.titleBarStyle = 'hidden'
  }
  const window = new BrowserWindow(windowOptions)

  if (dev) {
    window.loadURL(`http://localhost:3000/app`)
  } else {
    window.loadURL(
      url.format({
        pathname: path.join(app.getAppPath(), './compiled/index.html'),
        protocol: 'file',
        slashes: true,
      })
    )
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  if (MAC) {
    window.on('close', (event) => {
      event.preventDefault()
      window.hide()
    })

    app.on('before-quit', () => {
      window.removeAllListeners()
    })
  }

  window.on('closed', () => {
    mainWindow = null
  })

  return window
}

// single instance lock handler
if (!singleInstance) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow()

  app.on('open-url', (_event, url) => {
    mainWindow!.webContents.send('open-boostnote-url', url)
  })
})
