package com.acronexus.service;

import java.util.List;
import java.util.UUID;

public interface HodTransferService {
    /**
     * Transactionally assigns a user as HOD for a set of departments.
     * Removes HOD ownership from departments that the user previously managed but are no longer selected.
     * Recalculates roles for the target user and any displaced previous HODs.
     * 
     * @param targetUserId    The ID of the user being edited.
     * @param selectedDeptIds The exact list of Department IDs this user should now manage.
     */
    void assignHod(UUID targetUserId, List<UUID> selectedDeptIds);
}
