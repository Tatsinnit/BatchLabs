import { Dto, DtoAttr } from "@batch-flask/core";
import { MetaDataDto, PoolCreateDto } from "app/models/dtos";

export class JobPatchDto extends Dto<JobPatchDto> {
    @DtoAttr()
    public priority?: number;

    @DtoAttr()
    public constraints?: any;

    @DtoAttr()
    public poolInfo?: {
        poolId?: string;
        autoPoolSpecification: {
            autoPoolIdPrefix?: string;
            poolLifetimeOption?: "job" | "jobschedule";
            keepAlive?: boolean;
            pool?: PoolCreateDto;
        };
    };

    @DtoAttr()
    public onAllTasksComplete?: string;

    @DtoAttr()
    public metadata?: MetaDataDto[];
}
