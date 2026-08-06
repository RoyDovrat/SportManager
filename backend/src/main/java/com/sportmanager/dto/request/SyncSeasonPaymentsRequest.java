package com.sportmanager.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SyncSeasonPaymentsRequest {

    /** Optional. Defaults to the active season. */
    private Long seasonId;
}
