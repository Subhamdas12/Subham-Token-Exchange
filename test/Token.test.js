const { expect } = require("chai");
const { ethers } = require("hardhat");
const tokens = (n) => {
  return ethers.utils.parseEther(n.toString());
};
describe("Token", () => {
  let token,
    transactionResponse,
    transactionReceipt,
    accounts,
    deployer,
    receiver,
    exchange;

  let amount = tokens(100);
  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    receiver = accounts[1];
    exchange = accounts[2];
    token = await Token.connect(deployer).deploy("Subham Das", "SD", 1000000);
  });
  describe("Deployment", () => {
    it("The name of the contract is same", async () => {
      expect(await token.getName()).to.equal("Subham Das");
    });
    it("The symbol of the smart contract is the same", async () => {
      expect(await token.getSymbol()).to.equal("SD");
    });
    it("The total Supply should be same", async () => {
      expect(await token.getTotalSupply()).to.equal(tokens(1000000));
    });
  });
  describe("Transfer", () => {
    describe("Success", () => {
      beforeEach(async () => {
        transactionResponse = await token
          .connect(deployer)
          .transfer(receiver.address, amount);
        transactionReceipt = await transactionResponse.wait();
      });
      it("Deployer balance decreased", async () => {
        expect(await token.getBalance(deployer.address)).to.equal(
          tokens(999900)
        );
      });
      it("Receiver balance increased", async () => {
        expect(await token.getBalance(receiver.address)).to.equal(tokens(100));
      });
      it("Emits a transfer event", async () => {
        const event = await transactionReceipt.events[0];
        expect(event.event).to.equal("Token__Transfer");
        const args = event.args;
        expect(args.sender).to.equal(deployer.address);
        expect(args.receiver).to.equal(receiver.address);
        expect(args.value).to.equal(amount);
      });
    });
    describe("Failure", () => {
      it("When the transfer amount is more then the balance of sender", async () => {
        await expect(
          token.connect(deployer).transfer(receiver.address, tokens(10000000))
        ).to.be.reverted;
      });
    });
  });
  describe("Approval", () => {
    describe("Success", () => {
      beforeEach(async () => {
        transactionResponse = await token.approve(exchange.address, amount);
        transactionReceipt = await transactionResponse.wait();
      });
      it("The approval is successful", async () => {
        expect(
          await token.getApproval(deployer.address, exchange.address)
        ).to.equal(amount);
      });
      it("Emits a approval event", async () => {
        const event = await transactionReceipt.events[0];
        expect(event.event).to.equal("Token__Approve");
        const args = event.args;
        expect(args.owner).to.equal(deployer.address);
        expect(args.spender).to.equal(exchange.address);
        expect(args.value).to.equal(amount);
      });
    });
    describe("Failure", () => {
      it("When the transfer amount is more then the balance of sender", async () => {
        await expect(
          token.connect(deployer).approve(exchange.address, tokens(10000000))
        ).to.be.reverted;
      });
    });
  });
  describe("TransferFrom", () => {
    describe("Success", () => {
      beforeEach(async () => {
        transactionResponse = await token
          .connect(deployer)
          .approve(exchange.address, amount);
        transactionReceipt = await transactionResponse.wait();
        transactionResponse = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amount);
        transactionReceipt = await transactionResponse.wait();
      });
      it("The token is reduced from deployer", async () => {
        expect(await token.getBalance(deployer.address)).to.equal(
          tokens(999900)
        );
      });
      it("The token is added to the receiver", async () => {
        expect(await token.getBalance(receiver.address)).to.equal(amount);
      });
      it("The approval is decreased", async () => {
        expect(
          await token.getApproval(deployer.address, exchange.address)
        ).to.equal(0);
      });
    });
    describe("Failure", () => {
      it("When the approval is not done", async () => {
        await expect(
          token
            .connect(exchange)
            .transferFrom(deployer.address, receiver.address, amount)
        ).to.be.reverted;
      });
    });
  });
});
