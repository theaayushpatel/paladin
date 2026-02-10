// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VulnerableProtocol
 * @notice Mock DeFi protocol with intentional reentrancy vulnerability
 * @dev Used for testing Paladin's detection and response capabilities
 */
contract VulnerableProtocol {
    mapping(address => uint256) public balances;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);

    /**
     * @notice Deposit ETH into the protocol
     */
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw ETH - VULNERABLE TO REENTRANCY!
     * @dev Intentionally vulnerable: external call before state update
     */
    function withdraw() external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");

        // VULNERABILITY: External call before state update
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        // State update happens AFTER external call (wrong!)
        balances[msg.sender] = 0;
        
        emit Withdrawal(msg.sender, balance);
    }

    /**
     * @notice Get contract's ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Approve Guardian to withdraw tokens in emergency
     * @param token Token to approve
     * @param guardian Guardian contract address
     * @param amount Amount to approve
     */
    function approveGuardian(address token, address guardian, uint256 amount) external {
        IERC20(token).approve(guardian, amount);
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
    }
}
