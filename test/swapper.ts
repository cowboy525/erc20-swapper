import { ethers, upgrades } from "hardhat";
import { solidity } from "ethereum-waffle";
import chai from "chai";
import { Erc20Mock, Erc20Swapper } from "../typechain";
import { IUniswapV2Router02 } from '../typechain/IUniswapV2Router02';
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

chai.use(solidity);
const { expect } = chai;

describe("Swapper", async () => {
  let swapper: Erc20Swapper;
  let mockERC20: Erc20Mock;
  let router: IUniswapV2Router02;

  let signer: SignerWithAddress;

  const amount = ethers.parseUnits("1000000");

  beforeEach(async () => {
    [signer] = await ethers.getSigners();
    console.log("Signer:", signer.address);

    // Deploy Swapper
    const swapperFactory = await ethers.getContractFactory("ERC20Swapper");
    const swapperContract = await upgrades.deployProxy(swapperFactory);
    await swapperContract.waitForDeployment();
    swapper = swapperFactory.attach(await swapperContract.getAddress()) as Erc20Swapper;
    console.log("Swapper:", swapper.target);

    // Deploy mock token
    const mockERC20Factory = await ethers.getContractFactory("ERC20Mock");
    const mockERC20Contract = await mockERC20Factory.deploy("TEST", "TEST", amount);
    await mockERC20Contract.waitForDeployment();
    mockERC20 = mockERC20Factory.attach(await mockERC20Contract.getAddress()) as Erc20Mock;
    console.log("Mock ERC20:", mockERC20.target);

    // Get router
    const routerAddress = await swapper.UNISWAP_ROUTER();
    router = await ethers.getContractAt("IUniswapV2Router02", routerAddress) as IUniswapV2Router02;
    console.log("Router:", router.target);

    // Add liquidity
    const ethBalance = await ethers.provider.getBalance(signer.address);
    console.log("Eth balance", ethBalance.toString());
    const tokenBalance = await mockERC20.balanceOf(signer.address);
    console.log("Token balance", tokenBalance.toString());

    const timestamp = await time.latest();
    const ethValue = ethers.parseUnits("1", 15); // 0.001 ETH
    const tokenValue = ethers.parseUnits("100", 18);
    await mockERC20.approve(router.target, tokenValue);
    await router.addLiquidityETH(mockERC20.target, tokenValue, 0, 0, signer.address, timestamp + 100, {value: ethValue});
    console.log("Added Liquidity");
  });

  it("test swap", async () => {
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("Eth balance", balance.toString());

    const swapEthAmount = ethers.parseUnits("100", 14); // 0.0001 ETH
    const tokenAmountBefore = await mockERC20.balanceOf(signer.address);
    await swapper.swapEtherToToken(mockERC20.address, 0, {value: swapEthAmount});
    const tokenAmountAfter = await mockERC20.balanceOf(signer.address);

    const swapAmount = tokenAmountAfter.sub(tokenAmountBefore);
    console.log("Swapped Amount", swapAmount.toString());
  });
});
