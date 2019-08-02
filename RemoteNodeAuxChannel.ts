import { SyncedRealtimeCausalTree, NullCausalTreeStore, RemoteEvent } from '@casual-simulation/causal-trees';
import { CausalTreeManager, SocketManager } from '@casual-simulation/causal-tree-client-socketio';
import { BaseAuxChannel, AuxUser, AuxConfig } from '@casual-simulation/aux-vm';
import { auxCausalTreeFactory, AuxCausalTree } from '@casual-simulation/aux-common';
import { NodeSigningCryptoImpl } from '@casual-simulation/crypto-node';

export class RemoteNodeAuxChannel extends BaseAuxChannel {

    private _socketManager: SocketManager;
    private _treeManager: CausalTreeManager;

    constructor(user: AuxUser, config: AuxConfig) {
        super(user, config);

        this._socketManager = new SocketManager(config.host);
        this._treeManager = new CausalTreeManager(
            this._socketManager, 
            auxCausalTreeFactory(),
            new NullCausalTreeStore());
        
        // Workaround until we let users specify
        // the crypto implementation for the causal tree manager.
        const treeManager: any = this._treeManager;
        treeManager._crypto = new NodeSigningCryptoImpl('ECDSA-SHA256-NISTP256');
    }

    async setGrant(grant: string): Promise<void> {}

    protected async _sendRemoteEvents(events: RemoteEvent[]): Promise<void> {
        const aux = <SyncedRealtimeCausalTree<AuxCausalTree>>this._aux;
        await aux.channel.connection.sendEvents(events);
    }

    protected async _createRealtimeCausalTree() {
        await this._socketManager.init();
        await this._treeManager.init();
        const tree = await this._treeManager.getTree<AuxCausalTree>(
            {
                id: this._config.treeName,
                type: 'aux',
            },
            this.user,
            {
                garbageCollect: true,

                // TODO: Allow reusing site IDs without causing multiple tabs to try and
                //       be the same site.
                alwaysRequestNewSiteId: true,
            }
        );

        return tree;
    }
}