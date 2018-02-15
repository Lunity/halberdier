const crypto = require('crypto');
const electron = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const url = require('url');

const {app, ipcMain, Menu} = electron;
const BrowserWindow = electron.BrowserWindow;

const ITEMS_FILE_PATH = os.homedir() + "/Dropbox/halberdier.dat";

const menuTemplate = [
    {
        label: 'Edit',
        submenu: [
            {role: 'undo'},
            {role: 'redo'},
            {type: 'separator'},
            {role: 'cut'},
            {role: 'copy'},
            {role: 'paste'},
            {role: 'pasteandmatchstyle'},
            {role: 'delete'},
            {role: 'selectall'}
        ]
    }
];

if (process.platform === 'darwin') {
    menuTemplate.unshift({
        label: 'Halberdier',
        submenu: [
            {role: 'about'},
            {type: 'separator'},
            {role: 'services', submenu: []},
            {type: 'separator'},
            {role: 'hide'},
            {role: 'hideothers'},
            {role: 'unhide'},
            {type: 'separator'},
            {role: 'quit'}
        ]
    })
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function encrypt(string, savePassword) {
    const cipher = crypto.createCipher('aes192', savePassword);
    let encrypted = cipher.update(string, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(string, loadPassword) {
    const decipher = crypto.createDecipher('aes192', loadPassword);
    let decrypted = decipher.update(string, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 960, height: 700});

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    ipcMain.on('get-items', (event, loadPassword) => {
        try {
            const fromFile = fs.readFileSync(ITEMS_FILE_PATH, 'utf8');
            let decrypted;
            let json;
            decrypted = decrypt(fromFile, loadPassword);
            json = JSON.parse(decrypted);
            json.masterPassword = loadPassword;
            event.sender.send('load-success', json)
        } catch (error) {
            event.sender.send('load-error')
        }
    });

    ipcMain.on('save-changes', (event, state, savePassword) => {
        try {
            const string = JSON.stringify(state);
            const encrypted = encrypt(string, savePassword);
            fs.writeFileSync(ITEMS_FILE_PATH, encrypted);
            event.sender.send('save-success');
        } catch (error) {
            event.sender.send('save-error');
        }
    });

    ipcMain.on('get-file-exists', (event) => {
        try {
            event.returnValue = fs.existsSync(ITEMS_FILE_PATH);
        } catch (error) {
            event.returnValue = false;
        }
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
