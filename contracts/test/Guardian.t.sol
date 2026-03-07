// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Guardian} from "../src/Guardian.sol";
import {RiskRegistry} from "../src/RiskRegistry.sol";
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
    RiskRegistry public riskRegistry;
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
        
        // Deploy RiskRegistry first
        riskRegistry = new RiskRegistry();
        
        // Deploy Guardian with RiskRegistry
        guardian = new Guardian(address(riskRegistry), safeAddress, COOLDOWN, MAX_WITHDRAWAL_BPS);
        token = new MockERC20();
        
        // Grant roles
        guardian.grantRole(guardian.CRE_WORKFLOW_ROLE(), creWorkflow);
        riskRegistry.grantRole(riskRegistry.GUARDIAN_ROLE(), address(guardian));
        
        // Setup protocol with tokens
        token.mint(protocol, 1000 ether);
        
        vm.stopPrank();
    }

    function testConstructor() public view {
        assertEq(guardian.safeAddress(), safeAddress);
        assertEq(guardian.cooldownPeriod(), COOLDOWN);
        assertEq(guardian.maxWithdrawalBps(), MAX_WITHDRAWAL_BPS);
        assertEq(address(guardian.riskRegistry()), address(riskRegistry));
    }

    function testConstructorRevertsInvalidSafeAddress() public {
        vm.expectRevert(Guardian.InvalidSafeAddress.selector);
        new Guardian(address(riskRegistry), address(0), COOLDOWN, MAX_WITHDRAWAL_BPS);
    }

    function testConstructorRevertsInvalidWithdrawalPercentage() public {
        vm.expectRevert(Guardian.InvalidWithdrawalPercentage.selector);
        new Guardian(address(riskRegistry), safeAddress, COOLDOWN, 10001); // Over 100%
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

    // ── MEDIUM/LOW: no token transfer, no cooldown stamp ──────────────────────

    function testEmergencyWithdrawMediumNoTransfer() public {
        uint256 amount = 100 ether;

        vm.prank(protocol);
        token.approve(address(guardian), type(uint256).max);

        uint256 protocolBefore = token.balanceOf(protocol);
        uint256 safeBefore     = token.balanceOf(safeAddress);

        vm.prank(creWorkflow);
        guardian.emergencyWithdraw(protocol, address(token), amount, Guardian.RiskLevel.MEDIUM);

        // No tokens should move — MEDIUM = alert only
        assertEq(token.balanceOf(protocol),     protocolBefore);
        assertEq(token.balanceOf(safeAddress),  safeBefore);

        // Cooldown must NOT be stamped (no withdrawal occurred)
        assertEq(guardian.lastWithdrawal(protocol), 0);

        // A MEDIUM ALERT event should still appear in The Chronicle
        RiskRegistry.RiskEvent memory evt = riskRegistry.getEvent(1);
        assertEq(uint8(evt.riskLevel),  uint8(RiskRegistry.RiskLevel.MEDIUM));
        assertEq(uint8(evt.actionType), uint8(RiskRegistry.ActionType.ALERT));
        assertEq(evt.amount, 0);
    }

    function testEmergencyWithdrawLowNoTransfer() public {
        uint256 amount = 100 ether;

        vm.prank(protocol);
        token.approve(address(guardian), type(uint256).max);

        uint256 protocolBefore = token.balanceOf(protocol);

        vm.prank(creWorkflow);
        guardian.emergencyWithdraw(protocol, address(token), amount, Guardian.RiskLevel.LOW);

        // No tokens should move, cooldown not set
        assertEq(token.balanceOf(protocol), protocolBefore);
        assertEq(guardian.lastWithdrawal(protocol), 0);
    }

    function testEmergencyWithdrawHighTransfers80Percent() public {
        uint256 amount = 100 ether;

        vm.prank(protocol);
        token.approve(address(guardian), amount);

        vm.prank(creWorkflow);
        guardian.emergencyWithdraw(protocol, address(token), amount, Guardian.RiskLevel.HIGH);

        // HIGH = 80 %
        assertEq(token.balanceOf(safeAddress), 80 ether);
        assertEq(token.balanceOf(protocol),    920 ether); // 1000 - 80
        assertTrue(guardian.lastWithdrawal(protocol) > 0);
    }

    function testEmergencyWithdrawMediumDoesNotBlockSubsequentWithdrawal() public {
        uint256 amount = 100 ether;

        vm.prank(protocol);
        token.approve(address(guardian), type(uint256).max);

        // MEDIUM call — no cooldown should be set
        vm.prank(creWorkflow);
        guardian.emergencyWithdraw(protocol, address(token), amount, Guardian.RiskLevel.MEDIUM);
        assertEq(guardian.lastWithdrawal(protocol), 0);

        // Immediate CRITICAL call should succeed (cooldown not active)
        vm.prank(creWorkflow);
        guardian.emergencyWithdraw(protocol, address(token), amount, Guardian.RiskLevel.CRITICAL);
        assertEq(token.balanceOf(safeAddress), amount);
    }

    // Cover line 130: when amount is so small that (amount * withdrawalBps) / 10000 == 0
    // the guard `if (actualAmount == 0) actualAmount = amount` kicks in.
    // For HIGH (8000 bps): 1 wei * 8000 / 10000 = 0 → actualAmount becomes 1 wei.
    function testEmergencyWithdrawAmountRoundingGuard() public {
        uint256 tinyAmount = 1; // 1 wei — rounds to 0 after 80% bps math

        vm.prank(protocol);
        token.approve(address(guardian), tinyAmount);

        vm.prank(creWorkflow);
        guardian.emergencyWithdraw(protocol, address(token), tinyAmount, Guardian.RiskLevel.HIGH);

        // The rounding guard kicks in: 1 wei is transferred whole rather than 0
        assertEq(token.balanceOf(safeAddress), tinyAmount);
    }

    // Cover line 121: when withdrawalBps from riskLevel exceeds maxWithdrawalBps,
    // it gets capped. CRITICAL returns 10000 bps — lower the cap to 5000 to trigger.
    function testEmergencyWithdrawCapsAtMaxWithdrawalBps() public {
        uint256 amount = 1000;
        uint256 cappedBps = 5000; // lower than CRITICAL's 10000 or HIGH's 8000

        // Admin lowers the cap before the withdrawal
        vm.prank(admin);
        guardian.setMaxWithdrawalBps(cappedBps);

        vm.prank(protocol);
        token.approve(address(guardian), amount);

        vm.prank(creWorkflow);
        guardian.emergencyWithdraw(protocol, address(token), amount, Guardian.RiskLevel.CRITICAL);

        // Only cappedBps (50%) should be withdrawn, not the full 100%
        assertEq(token.balanceOf(safeAddress), (amount * cappedBps) / 10000);
    }
}
