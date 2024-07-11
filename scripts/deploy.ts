import { upgrades, ethers } from "hardhat";

async function main() {
  // const amount = ethers.parseUnits("1000000");
  // const mockERC20Factory = await ethers.getContractFactory("ERC20Mock");
  // const mockERC20Contract = await mockERC20Factory.deploy("TEST", "TEST", amount);
  // await mockERC20Contract.waitForDeployment();
  // console.log("Mock ERC20:", await mockERC20Contract.getAddress());

  const Swapper = await ethers.getContractFactory("ERC20Swapper");
  const swapper = await upgrades.deployProxy(Swapper);
  await swapper.waitForDeployment();
  console.log("Swapper address:", await swapper.getAddress()); // eslint-disable-line no-console
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error); // eslint-disable-line no-console
    process.exit(1);
  });
