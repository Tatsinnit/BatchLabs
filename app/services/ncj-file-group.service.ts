import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { ServerError } from "@batch-flask/core";
import { FileGroupCreateDto } from "app/models/dtos";
import { PythonRpcService } from "./python-rpc/python-rpc.service";

/**
 * Service to handle file-group calls to the Python RPC service.
 */
@Injectable()
export class NcjFileGroupService {
    constructor(
        private pythonRpcService: PythonRpcService) {
    }

    /**
     * Calls the Batch CLI via Python to create a file-group in the Batch account's
     * linked storage account.
     */
    public createFileGroup(fileGroup: FileGroupCreateDto): Observable<any> {

        /**
         * TODO: This method needs a callback for updating the UI with the status of the upload
         * progress. Anna was working on changing the file.upload callback parameter to include the
         * filename in order for this to happen.
         */
        const observable = this.pythonRpcService.callWithAuth("create-file-group", [
            fileGroup.name,
            fileGroup.folder,
            { ...fileGroup.options, recursive: fileGroup.includeSubDirectories },
        ]).catch((error) => {
            return Observable.throw(ServerError.fromPython(error));
        });

        return observable;
    }
}
