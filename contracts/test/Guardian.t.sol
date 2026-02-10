// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Guardian} from "../src/Guardian.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockERC20 is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;

    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
}

/**
 * @title GuardianTest
 * @notice Test suite for Guardian contract
 */
contract GuardianTest is Test {
    Guardian public guardian;
    MockERC20 public token;
    
    address public admin = address(1);
    address public creWorkflow = address(2);
    address public safeAddress = address(3);
    address public protocol = address(4);
    
    uint256 constant COOLDOWN = 5 minutes;
    uint256 constant MAX_WITHDRAWAL_BPS = 10000; // 100%

    event EmergencyWithdrawal(
        address indexed protocol,
        address indexed token,
        uint256 amount,
        Guardian.RiskLevel riskLevel,
        uint256 timestamp
    );

    function setUp() public {
        vm.startPrank(admin);
        
        guardian = new Guardian(safeAddress, COOLDOWN, MAX_WITHDRAWAL_BPS);
        token = new MockERC20();
        
        // Grant CRE_WORKFLOW_ROLE to creWorkflow address
        guardian.grantRole(guardian.CRE_WORKFLOW_ROLE(), creWorkflow);
        
        // Setup protocol with tokens
        token.mint(protocol, 1000 ether);
        
        vm.stopPrank();
    }

    function testConstructor() public view {
        assertEq(guardian.safeAddress(), safeAddress);
        assertEq(guardian.cooldownPeriod(), COOLDOWN);
        assertEq(guardian.maxWithdrawalBps(), MAX_WITHDRAWAL_BPS);
    }

    function testConstructorRevertsInvalidSafeAddress() public {
        vm.expectRevert(Guardian.InvalidSafeAddress.selector);
        new Guardian(address(0), COOLDOWN, MAX_WITHDRAWAL_BPS);
    }

    function testConstructorRevertsInvalidWithdrawalPercentage() public {
        vm.expectRevert(Guardian.InvalidWithdrawalPercentage.selector);
        new Guardian(safeAddress, COOLDOWN, 10001); // Over 100%
    }

    function testEmergencyWithdrawCritical() public {
        uint256 amount = 100 ether;
        
        // Protocol approves Guardian
        vm.prank(protocol);
        token.approve(address(guardian), amount);
        
        // CRE workflow executes emergency withdrawal
        vm.prank(creWorkflow);
        vm.expectEmit(true, true, false, true);
        emit EmergencyWithdrawal(protocol, address(token), amount, Guardian.RiskLevel.CRITICAL, block.timestamp);
        
        guardian.emergencyWithdraw(
            protocol,
            address(token),
            amount,
            Guardian.RiskLevel.CRITICAL
        );
        
        // Verify funds moved to safe
        assertEq(token.balanceOf(safeAddress), amount);
        assertEq(token.balanceOf(protocol), 900 ether);
    }

    function testEmergencyWithdrawRevertsUnauthorized() public {
        uint256 amount = 100 ether;
        
        vm.prank(address(0x999)); // Unauthorized caller
        vm.expectRevert();
        guardian.emergencyWithdraw(
            protocol,
            address(token),
            amount,
            Guardian.RiskLevel.CRITICAL
        );
    }

    function testEmergencyWithdrawRevertsCooldownNotElapsed() public {
        uint256 amount = 100 ether;
        
        vm.startPrank(protocol);
        token.approve(address(guardian), amount * 2);
        vm.stopPrank();
        
        // First withdrawal succeeds
        vm.prank(creWorkflow);
        guardian.emergencyWithdraw(protocol, address(token), amount, Guardian.RiskLevel.CRITICAL);
        
        // Second withdrawal before cooldown fails
        vm.prank(creWorkflow);
        vm.expectRevert(Guardian.CooldownNotElapsed.selector);
        guardian.emergencyWithdraw(protocol, address(token), amount, Guardian.RiskLevel.CRITICAL);
        
        // After cooldown, it succeeds
        vm.warp(block.timestamp + COOLDOWN + 1);
        vm.prank(creWorkflow);
        guardian.emergencyWithdraw(protocol, address(token), amount, Guardian.RiskLevel.CRITICAL);
    }

    function testEmergencyWithdrawRevertsExceedsLimit() public {
        uint256 limit = 50 ether;
        uint256 amount = 100 ether;
        
        // Set protocol limit
        vm.prank(admin);
        guardian.setProtocolLimit(protocol, limit);
        
        vm.prank(protocol);
        token.approve(address(guardian), amount);
        
        // Withdrawal exceeding limit fails
        vm.prank(creWorkflow);
        vm.expectRevert(Guardian.ExceedsWithdrawalLimit.selector);
        guardian.emergencyWithdraw(protocol, address(token), amount, Guardian.RiskLevel.CRITICAL);
    }

    function testSetProtocolLimit() public {
        uint256 newLimit = 500 ether;
        
        vm.prank(admin);
        guardian.setProtocolLimit(protocol, newLimit);
        
        assertEq(guardian.protocolWithdrawalLimits(protocol), newLimit);
    }

    function testSetCooldownPeriod() public {
        uint256 newCooldown = 10 minutes;
        
        vm.prank(admin);
        guardian.setCooldownPeriod(newCooldown);
        
        assertEq(guardian.cooldownPeriod(), newCooldown);
    }

    function testSetCooldownRevertsInvalidCooldown() public {
        vm.prank(admin);
        vm.expectRevert(Guardian.InvalidCooldown.selector);
        guardian.setCooldownPeriod(8 days); // Over 7 days
    }

    function testSetMaxWithdrawalBps() public {
        uint256 newMaxBps = 8000; // 80%
        
        vm.prank(admin);
        guardian.setMaxWithdrawalBps(newMaxBps);
        
        assertEq(guardian.maxWithdrawalBps(), newMaxBps);
    }

    function testSetMaxWithdrawalBpsRevertsInvalid() public {
        vm.prank(admin);
        vm.expectRevert(Guardian.InvalidWithdrawalPercentage.selector);
        guardian.setMaxWithdrawalBps(10001);
    }

    function testDifferentRiskLevels() public pure {
        // Just verify contract compiles with all risk levels
        Guardian.RiskLevel level;
        level = Guardian.RiskLevel.LOW;
        level = Guardian.RiskLevel.MEDIUM;
        level = Guardian.RiskLevel.HIGH;
        level = Guardian.RiskLevel.CRITICAL;
        // Silence unused variable warning
        level;
    }
}
