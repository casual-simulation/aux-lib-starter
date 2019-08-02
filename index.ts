import { RemoteNodeAuxChannel } from './RemoteNodeAuxChannel';
import { NodeSimulation } from '@casual-simulation/aux-vm-node';
import { AuxUser, Simulation } from '@casual-simulation/aux-vm';
import repl from 'repl';

// This is the index file, so it gets run first.
// Once Node is loaded up we want to start the app.
start();

async function start() {

    // The user that we want the program to act as.
    // In a real-world scenario we would not hardcode these values
    // and we would store the token in a secure location like using hashicorp vault.
    const user: AuxUser = {
        id: 'myUserId',
        username: 'myUsername',
        name: 'myName',
        token: 'mySecretToken',
        isGuest: false
    };

    // The config values that the RemoteNodeAuxChannel
    // needs. This indicates where to connect and what channel to load.
    // This is all gonna get cleaned up since some values are repeated.
    const config = {
        config: { isBuilder: false, isPlayer: false },
        host: 'https://auxplayer.com',
        id: 'https://auxplayer.com/*/hello',
        treeName: 'aux-hello'
    };

    // The channel connection.
    // This is a low-level abstraction for an AUX channel and manages
    // authentication, syncing, and scripts/formulas.
    const channel = new RemoteNodeAuxChannel(user, config);

    // The simulation.
    // This is a high-level abstraction for an AUX virtual machine and makes it easier to 
    // use AUXes.
    // Ignore the cast.
    const sim = new NodeSimulation(<any>channel, config.id, config.config);

    // Initialize the simulation.
    // This in turn will initialize the channel and everything else needed to connect to the aux.
    await sim.init();

    // Setup a listener on the simulation's connection manager
    // for when we are synced with the server.
    // When we're synced we know we have the most up to date data
    // and we can communicate our changes to the server.
    // Note that this will not fire if we are not allowed to connect.
    // This may happen if we are not authenticated/authorized.
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