import { RemoteNodeAuxChannel } from './RemoteNodeAuxChannel';
import { NodeSimulation } from '@casual-simulation/aux-vm-node';
import { AuxUser, Simulation } from '@casual-simulation/aux-vm';
import repl from 'repl';

start();

async function start() {
    const user: AuxUser = {
        id: 'myUserId',
        username: 'myUsername',
        name: 'myName',
        token: 'mySecretToken',
        isGuest: false
    };

    // This is all gonna get cleaned up
    const config = {
        config: { isBuilder: false, isPlayer: false },
        host: 'https://auxplayer.com',
        id: 'https://auxplayer.com/*/hello',
        treeName: 'aux-hello'
    };
    const channel = new RemoteNodeAuxChannel(user, config);

    // Ignore the cast
    const sim = new NodeSimulation(<any>channel, config.id, config.config);

    await sim.init();

    sim.connection.syncStateChanged.subscribe(synced => {
        if (synced) {
            console.log("We're synced!");
            startRepl(sim);
        } else {
            console.log('No longer synced.');
        }
    });
}

function startRepl(sim: Simulation) {
    const server = repl.start({
        prompt: `${sim.id} > `,
        eval: evalScript
    });

    server.on('exit', () => {
        sim.unsubscribe();
        process.exit();
    });

    async function evalScript(cmd: string, context: any, filename: any, callback: (err: any, output: any) => void) {
        const result = await sim.helper.search(cmd);
        callback(null, result);
    }
}