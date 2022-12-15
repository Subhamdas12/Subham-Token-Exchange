const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...!!");
  const Token = await ethers.getContractFactory("Token");
  const Exchange = await ethers.getContractFactory("Exchange");
  const accounts = await ethers.getSigners();
  const subham = await Token.connect(accounts[0]).deploy(
    "Subham Das",
    "SD",
    1000000
  );
  await subham.deployed();
  const mETH = await Token.connect(accounts[0]).deploy("mETH", "mETH", 1000000);
  await mETH.deployed();
  const mDAI = await Token.connect(accounts[0]).deploy("mDAI", "mDAI", 1000000);
  await mDAI.deployed();
  const exchange = await Exchange.connect(accounts[0]).deploy(
    accounts[1].address,
    10
  );
  await exchange.deployed();
  console.log(`Subham Das is deployed in ${subham.address}`);
  console.log(`mETH  is deployed in ${mETH.address}`);
  console.log(`mDAI  is deployed in ${mDAI.address}`);
  console.log(`Exchange  is deployed in ${exchange.address}`);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
