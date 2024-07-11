// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20Swapper} from "./interfaces/IERC20Swapper.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ERC20Swapper is IERC20Swapper, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    address public constant UNISWAP_ROUTER = 0x425141165d3DE9FEC831896C016617a52363b687;

    event SwapETHToToken(address token, uint256 amount, address user);

    event WithdrawFunds(address token, uint256 amount, address to);

    event WithdrawETH(uint256 amount, address to);

    function initialize() external initializer() {
        __Ownable_init(msg.sender);
    }

    receive() external payable {}

    /**
     * @dev swaps the `msg.value` Ether to at least `minAmount` of tokens in `address`, or reverts
     * @param token The address of ERC-20 token to swap
     * @param minAmount The minimum amount of tokens transferred to msg.sender
     * @return The actual amount of transferred tokens
     */
    function swapEtherToToken(address token, uint256 minAmount) public override payable returns (uint256) {
        uint256 etherAmount = msg.value;
        address user = msg.sender;

        // Ensure the contract has received some Ether to swap
        require(etherAmount > 0, "No Ether sent to contract");

        IUniswapV2Router02 router = IUniswapV2Router02(UNISWAP_ROUTER);

        // Create path for swap from ETH, assume token has pair with WETH
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = token;

        // Calculate the amount of tokens to transfer
        uint256[] memory amounts = router.getAmountsOut(etherAmount, path);        

        // Ensure the calculated amount meets the minimum required
        require(amounts[1] >= minAmount, "Token amount less than minAmount");

        // Swap ETH to `token` and transfer to user
        IUniswapV2Router02(UNISWAP_ROUTER).swapExactETHForTokens{value: msg.value}(minAmount, path, user, block.timestamp);

        emit SwapETHToToken(token, amounts[1], user);

        return amounts[1];
    }

    /**
     * @dev Withdraw funds to user
     * @param token The address of the token
     * @param amount The amount of funds to withdraw
     * @param to The address to receive funds
     */
    function withdrawFunds(address token, uint256 amount, address to) external onlyOwner {
        // Transfer funds to user
        IERC20(token).safeTransfer(to, amount);

        emit WithdrawFunds(token, amount, to);
    }

    /**
     * @dev Withdraw ETH to user
     * @param amount The amount of funds to withdraw
     * @param to The address to receive funds
     */
    function withdrawETH(uint256 amount, address to) external onlyOwner {
        // Transfer ETH to user
        payable(to).transfer(amount);

        emit WithdrawETH(amount, to);
    }
}
