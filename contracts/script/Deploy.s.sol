// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Guardian} from "../src/Guardian.sol";
import {RiskRegistry} from "../src/RiskRegistry.sol";
import {VulnerableProtocol} from "../src/mocks/VulnerableProtocol.sol";

/**
 * @title Deploy
 * @notice Deployment script for Paladin Protocol contracts
 */
contract Deploy is Script {
    // Default configuration
    uint256 constant DEFAULT_COOLDOWN = 5 minutes;
    uint256 constant DEFAULT_MAX_WITHDRAWAL_BPS = 10000; // 100%

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Use deployer address as safe address if SAFE_ADDRESS not set
        address safeAddress = vm.envOr("SAFE_ADDRESS", deployer);
        
        console.log("=== Paladin Protocol Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Safe Address:", safeAddress);
        console.log("Network: Arbitrum Sepolia");
        console.log("");

        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy RiskRegistry (The Chronicle)
        console.log("Deploying RiskRegistry...");
        RiskRegistry riskRegistry = new RiskRegistry();
        console.log("RiskRegistry deployed at:", address(riskRegistry));
        
        // 2. Deploy Guardian (The Sword)
        console.log("Deploying Guardian...");
        Guardian guardian = new Guardian(
            address(riskRegistry),
            safeAddress,
            DEFAULT_COOLDOWN,
            DEFAULT_MAX_WITHDRAWAL_BPS
        );
        console.log("Guardian deployed at:", address(guardian));
        
        // 3. Grant Guardian role to access RiskRegistry
        console.log("Configuring roles...");
        bytes32 guardianRole = riskRegistry.GUARDIAN_ROLE();
        riskRegistry.grantRole(guardianRole, address(guardian));
        console.log("Guardian role granted to Guardian contract");
        
        // 4. Deploy VulnerableProtocol for testing
        console.log("Deploying VulnerableProtocol (demo)...");
        VulnerableProtocol vulnerableProtocol = new VulnerableProtocol();
        console.log("VulnerableProtocol deployed at:", address(vulnerableProtocol));
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("");
        console.log("Update your .env file with:");
        console.log("GUARDIAN_ADDRESS=", address(guardian));
        console.log("RISK_REGISTRY_ADDRESS=", address(riskRegistry));
        console.log("");
        console.log("Next steps:");
        console.log("1. Update .env with the addresses above");
        console.log("2. Grant CRE_WORKFLOW_ROLE to your CRE workflow address");
        console.log("3. Test with VulnerableProtocol at:", address(vulnerableProtocol));
    }
}
