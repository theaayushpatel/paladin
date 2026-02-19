// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRiskRegistry
 * @notice Interface for The Chronicle - immutable record of threats and actions
 */
interface IRiskRegistry {
    enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    enum ActionType {
        ALERT,
        WITHDRAWAL,
        GOVERNANCE_PROPOSAL
    }

    function recordThreat(
        address protocol,
        address token,
        uint256 amount,
        RiskLevel riskLevel,
        ActionType actionType,
        string calldata exploitPattern
    ) external returns (uint256);
}
