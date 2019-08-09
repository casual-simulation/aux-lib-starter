import { nodeSimulationForRemote } from '@casual-simulation/aux-vm-node/managers/NodeSimulationFactories';
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

    // The simulation.
    // This is a high-level abstraction for an AUX virtual machine and makes it easier to 
    // use AUXes.
    const sim = nodeSimulationForRemote(
        'https://auxplayer.com',
        user,
        'hello',
        { isBuilder: false, isPlayer: false }
    );

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