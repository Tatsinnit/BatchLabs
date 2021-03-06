import { Type } from "@angular/core";

import { ServerError } from "@batch-flask/core";
import { StorageClientService } from "app/services//storage-client.service";
import { EntityGetter, EntityGetterConfig } from "app/services/core/data/entity-getter";
import { Observable } from "rxjs";

export interface StorageEntityGetterConfig<TEntity, TParams> extends EntityGetterConfig<TEntity, TParams> {
    /**
     * Get function(usually call the client proxy)
     */
    getFn: (client: any, params: TParams) => Promise<any>;
}
export class StorageEntityGetter<TEntity, TParams> extends EntityGetter<TEntity, TParams> {
    private _getMethod: (client: any, params: TParams) => Promise<any>;

    constructor(
        type: Type<TEntity>,
        private storageClient: StorageClientService,
        config: StorageEntityGetterConfig<TEntity, TParams>) {

        super(type, config);
        this._getMethod = config.getFn;
    }

    protected getData(params: TParams): Observable<any> {
        return this.storageClient.get().flatMap((client) => {
            return Observable.fromPromise(this._getMethod(client, params));
        }).map(x => x.data)
            .catch((error) => {
                return Observable.throw(ServerError.fromStorage(error));
            }).share();
    }
}
