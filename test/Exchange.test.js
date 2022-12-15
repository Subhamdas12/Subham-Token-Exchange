const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const tokens = (n) => {
  return ethers.utils.parseEther(n.toString());
};
const provider = ethers.getDefaultProvider();

let subham,
  mDAI,
  exchange,
  user1,
  user2,
  user3,
  transactionResponse,
  transactionReceipt;
let amount = tokens(1);
let secondAmount = tokens(2);
describe("Exchange", () => {
  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    const Exchange = await ethers.getContractFactory("Exchange");
    const accounts = await ethers.getSigners();
    user1 = accounts[0];
    user2 = accounts[1];
    user3 = accounts[2];
    subham = await Token.connect(user1).deploy("Subham Das", "SD", 1000000);
    mDAI = await Token.connect(user1).deploy("mDAI", "mDAI", 1000000);
    exchange = await Exchange.connect(user1).deploy(user3.address, 10);
  });
  describe("Deployment", () => {
    it("The fee account is same", async () => {
      expect(await exchange.getFeeAccount()).to.equal(user3.address);
    });
    it("The fee percent is same", async () => {
      expect(await exchange.getFeePercent()).to.equal(10);
    });
  });
  describe("DepositToken", () => {
    describe("Success", () => {
      beforeEach(async () => {
        transactionResponse = await subham
          .connect(user1)
          .approve(exchange.address, amount);
        transactionReceipt = await transactionResponse.wait();
        transactionResponse = await exchange
          .connect(user1)
          .depositToken(subham.address, amount);
        transactionReceipt = await transactionResponse.wait();
      });
      it("Deposit tokens", async () => {
        expect(
          await exchange.getBalance(subham.address, user1.address)
        ).to.equal(amount);
      });
      it("The number of tokens increased for exchange in subham", async () => {
        expect(await subham.balanceOf(exchange.address)).to.equal(amount);
      });
      it("The number of tokens decreased for user1 in subham", async () => {
        expect(await subham.balanceOf(user1.address)).to.equal(tokens(999999));
      });
      it("Emits a deploy event", async () => {
        const event = await transactionReceipt.events[1];
        const args = event.args;
        expect(event.event).to.equal("Exchange__DepositToken");
        expect(args.token).to.equal(subham.address);
        expect(args.owner).to.equal(user1.address);
        expect(args.amount).to.equal(amount);
        expect(args.balance).to.equal(amount);
      });
    });
    describe("Failure", () => {
      it("Deploying tokens without approval", async () => {
        await expect(exchange.depositToken(subham.address, amount)).to.be
          .reverted;
      });
    });
  });
  describe("Withdraw", () => {
    describe("Success", () => {
      beforeEach(async () => {
        transactionResponse = await subham
          .connect(user1)
          .approve(exchange.address, amount);
        transactionReceipt = await transactionResponse.wait();
        transactionResponse = await exchange
          .connect(user1)
          .depositToken(subham.address, amount);
        transactionReceipt = await transactionResponse.wait();
        transactionResponse = await exchange
          .connect(user1)
          .withdrawToken(subham.address, amount);
        transactionReceipt = await transactionResponse.wait();
      });
      it("The balance should decrease", async () => {
        expect(
          await exchange.getBalance(subham.address, user1.address)
        ).to.equal(0);
      });
      it("The balance should decrease from the token too for the exchange", async () => {
        expect(await subham.getBalance(exchange.address)).to.equal(0);
      });

      it("The balance should increase from the token too for the user1", async () => {
        expect(await subham.getBalance(user1.address)).to.equal(
          tokens(1000000)
        );
      });
      it("It emits a withdraw event", async () => {
        const event = await transactionReceipt.events[1];
        const args = event.args;
        expect(event.event).to.equal("Exchange__WithdrawToken");
        expect(args.token).to.equal(subham.address);
        expect(args.owner).to.equal(user1.address);
        expect(args.amount).to.equal(amount);
        expect(args.balance).to.equal(0);
      });
    });
    describe("Failure", () => {
      beforeEach(async () => {
        transactionResponse = await subham
          .connect(user1)
          .approve(exchange.address, amount);
        transactionReceipt = await transactionResponse.wait();
        transactionResponse = await exchange
          .connect(user1)
          .depositToken(subham.address, amount);
        transactionReceipt = await transactionResponse.wait();
      });
      it("When the amount tried to withdraw is greater then the amount deposited", async () => {
        await expect(
          exchange.connect(user1).withdrawToken(subham.address, secondAmount)
        ).to.be.reverted;
      });
    });
  });
  describe(" OrderDetails ", () => {
    beforeEach(async () => {
      transactionResponse = await subham
        .connect(user1)
        .approve(exchange.address, amount);
      transactionReceipt = await transactionResponse.wait();
      transactionResponse = await exchange
        .connect(user1)
        .depositToken(subham.address, amount);
      transactionReceipt = await transactionResponse.wait();
    });
    describe(" MakeOrder ", () => {
      describe("Success", () => {
        beforeEach(async () => {
          transactionResponse = await exchange.makeOrder(
            mDAI.address,
            amount,
            subham.address,
            amount
          );
          transactionReceipt = await transactionResponse.wait();
        });
        it("It increased the order id ", async () => {
          expect(await exchange.getOrderId()).to.equal(1);
        });
        it("It emits a make order event", async () => {
          const event = await transactionReceipt.events[0];
          const args = event.args;
          expect(event.event).to.equal("Exchange__MakeOrder");
          expect(args.orderId).to.equal(1);
          expect(args.owner).to.equal(user1.address);
          expect(args.tokenGet).to.equal(mDAI.address);
          expect(args.amountGet).to.equal(amount);
          expect(args.tokenGive).to.equal(subham.address);
          expect(args.amountGive).to.equal(amount);
        });
      });
      describe("Failure", () => {
        it("When the tokenGive is more then the total balance ", async () => {
          await expect(
            exchange.makeOrder(
              mDAI.address,
              amount,
              subham.address,
              secondAmount
            )
          ).to.be.reverted;
        });
      });
    });
    describe("Cancel Order", () => {
      describe("Success", () => {
        beforeEach(async () => {
          transactionResponse = await exchange.makeOrder(
            mDAI.address,
            amount,
            subham.address,
            amount
          );
          transactionReceipt = await transactionResponse.wait();
          transactionResponse = await exchange.cancelOrder(1);
          transactionReceipt = await transactionResponse.wait();
        });
        it(" The cancelledOrder becomes true", async () => {
          expect(await exchange.s_cancelledOrder(1)).to.equal(true);
        });
      });
      describe("Failure", () => {
        it("It doesnot cancel a order which is already cancelled", async () => {
          transactionResponse = await exchange.makeOrder(
            mDAI.address,
            amount,
            subham.address,
            amount
          );
          transactionReceipt = await transactionResponse.wait();
          transactionResponse = await exchange.cancelOrder(1);
          transactionReceipt = await transactionResponse.wait();
          await expect(exchange.cancelOrder(1)).to.be.reverted;
        });
        it("Other's cant cancel", async () => {
          transactionResponse = await exchange.makeOrder(
            mDAI.address,
            amount,
            subham.address,
            amount
          );
          transactionReceipt = await transactionResponse.wait();
          await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted;
        });
      });
    });
    describe("Fill Order", () => {
      beforeEach(async () => {
        transactionResponse = await mDAI
          .connect(user1)
          .transfer(user2.address, secondAmount);
        transactionReceipt = await transactionResponse.wait();
        transactionResponse = await mDAI
          .connect(user2)
          .approve(exchange.address, secondAmount);
        transactionReceipt = await transactionResponse.wait();
        transactionResponse = await exchange
          .connect(user2)
          .depositToken(mDAI.address, secondAmount);
        transactionReceipt = await transactionResponse.wait();
        transactionResponse = await exchange
          .connect(user1)
          .makeOrder(mDAI.address, amount, subham.address, amount);
        transactionReceipt = await transactionResponse.wait();
      });
      describe("Success", () => {
        beforeEach(async () => {
          transactionResponse = await exchange.connect(user2).fillOrder(1);
          transactionReceipt = await transactionResponse.wait();
        });
        it("The order is filled ", async () => {
          expect(await exchange.s_filledOrder(1)).to.equal(true);
        });
        it("The tokenGet increase from user1", async () => {
          expect(
            await exchange.getBalance(mDAI.address, user1.address)
          ).to.equal(amount);
        });
        it("The tokenGet decrease from user2", async () => {
          expect(
            await exchange.getBalance(mDAI.address, user2.address)
          ).to.equal(tokens(0.9));
        });
        it("the tokenGet also increase for feeAccount", async () => {
          expect(
            await exchange.getBalance(mDAI.address, user3.address)
          ).to.equal(tokens(0.1));
        });
        it("The tokenGive decrease for user1", async () => {
          expect(
            await exchange.getBalance(subham.address, user1.address)
          ).to.equal(0);
        });
        it("The tokenGive increase for user2", async () => {
          expect(
            await exchange.getBalance(subham.address, user2.address)
          ).to.equal(amount);
        });
        it("Emits a trade event ", async () => {
          const event = await transactionReceipt.events[0];
          const args = event.args;
          expect(event.event).to.equal("Exchange__Trade");
          expect(args.orderId).to.equal(1);
          expect(args.filler).to.equal(user2.address);
          expect(args.tokenGet).to.equal(mDAI.address);
          expect(args.amountGet).to.equal(amount);
          expect(args.tokenGive).to.equal(subham.address);
          expect(args.amountGive).to.equal(amount);
          expect(args.owner).to.equal(user1.address);
        });
      });
      describe("Failure", () => {
        it("if an invalid id is passed , it cancel ", async () => {
          await expect(exchange.connect(user2).fillOrder(3)).to.be.reverted;
        });
        it("If a order is already cancelled , it will be reverted", async () => {
          transactionResponse = await exchange.cancelOrder(1);
          transactionReceipt = await transactionResponse.wait();
          await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted;
        });
        it("If a order is already filled , it will be reverted", async () => {
          transactionResponse = await exchange.connect(user2).fillOrder(1);
          transactionReceipt = await transactionResponse.wait();
          await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted;
        });
      });
    });
  });
  describe("Ether swap ", () => {
    describe("BuyTokens", () => {
      it("Buys dai in exchange of ethers", async () => {
        console.log(
          `the balance of user1 before the transaction ${(
            await mDAI.balanceOf(user1.address)
          ).toString()}`
        );
        transactionResponse = await mDAI
          .connect(user1)
          .transfer(exchange.address, tokens(1000000));
        console.log(
          `the balance of user1 after the transaction ${(
            await mDAI.balanceOf(user1.address)
          ).toString()}`
        );
        console.log(
          `the balance of exchange after the transaction ${(
            await mDAI.balanceOf(exchange.address)
          ).toString()}`
        );
        console.log(
          `user1 ether balance before buying mDAI  ${(
            await provider.getBalance(user1.address)
          ).toString()}`
        );
        console.log(
          `the balance of user1 before the buyToken ${(
            await mDAI.balanceOf(user1.address)
          ).toString()}`
        );
        transactionResponse = await exchange
          .connect(user1)
          .buyTokens(mDAI.address, {
            from: user1.address,
            value: tokens(2780),
          });
        console.log(
          `user1 ether balance after buying mDAI  ${(
            await provider.getBalance(user1.address)
          ).toString()}`
        );
        console.log(
          `the balance of user1 after the buyToken ${(
            await mDAI.balanceOf(user1.address)
          ).toString()}`
        );
        console.log(
          `the balance of exchange after selling the tokens to user1 ${(
            await mDAI.balanceOf(exchange.address)
          ).toString()}`
        );
      });
    });
    describe("SellToken", () => {
      beforeEach(async () => {
        transactionResponse = await mDAI
          .connect(user1)
          .transfer(exchange.address, tokens(1000000));
        transactionResponse = await exchange
          .connect(user1)
          .buyTokens(mDAI.address, {
            from: user1.address,
            value: tokens(2780),
          });
      });
      it("Selling mDAI in exchange of real ether", async () => {
        console.log(
          `the mDAI of user1 before the sellToken ${(
            await mDAI.balanceOf(user1.address)
          ).toString()}`
        );
        console.log(
          `the mDAI of exchange before the sellToken ${(
            await mDAI.balanceOf(exchange.address)
          ).toString()}`
        );
        console.log(
          `user1 ether balance before selling mDAI  ${(
            await provider.getBalance(user1.address)
          ).toString()}`
        );
        transactionResponse = await mDAI
          .connect(user1)
          .approve(exchange.address, tokens(2780));
        transactionResponse = await exchange.sellToken(
          mDAI.address,
          tokens(2780)
        );
        console.log(
          `the mDAI of user1 after the sellToken ${(
            await mDAI.balanceOf(user1.address)
          ).toString()}`
        );
        console.log(
          `the mDAI of exchange before the sellToken ${(
            await mDAI.balanceOf(exchange.address)
          ).toString()}`
        );
        console.log(
          `user1 ether balance after selling mDAI  ${(
            await provider.getBalance(user1.address)
          ).toString()}`
        );
      });
    });
  });
});
