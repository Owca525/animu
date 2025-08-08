import { Client, DefaultMediaReceiver } from 'castv2-client';
import Bonjour from 'bonjour';
import { ipcMain } from 'electron';

const bonjour = Bonjour();

const devices: { host: string, port: number, name: string }[] = [];
const browser = bonjour.find({ type: 'googlecast' });
browser.stop()

ipcMain.handle("searchChromeCast", (_event) => {
    browser.on('up', (service) => {
        const device = {
            name: service.name,
            host: service.addresses[0],
            port: service.port
        }

        if (!devices.some(d => d.host === device.host)) devices.push(device);
    });

    browser.start();
});

ipcMain.handle("getListChromcasts", (_event) => {
    return devices
});

ipcMain.handle("stopSearchChromcast", (_event) => {
    browser.stop();
});

ipcMain.handle("playOnChromeCast", (_event, device: { host: string, port: number, name: string }, metadata: { title: string, time: number, url: string, type: string }) => {
    const client = new Client();

    client.connect(device.host, () => {
        console.log(`connect ${device.name} (${device.host})`);

        client.launch(DefaultMediaReceiver, (err, player) => {

            if (err) console.log(err)

            const media = {
                contentId: metadata.url,
                contentType: metadata.type, // video/mp4
                streamType: 'BUFFERED',
                metadata: {
                    type: 0,
                    metadataType: 0,
                    title: metadata.title,
                }
            };

            player.load(media, { autoplay: true, currentTime: metadata.time }, (err, status) => {
                if (err) console.log(err)
                console.log(status);
            });
        });
    });
});