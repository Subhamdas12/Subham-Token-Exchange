import { ethers } from "ethers";
import TOKEN_ABI from "../abis/Token.json";
import EXCHANGE_ABI from "../abis/Exchange.json";
export const loadProvider = (dispatch) => {
  const connection = new ethers.providers.Web3Provider(window.ethereum);
  dispatch({ type: "PROVIDER_LOADED", connection });
  return connection;
};
export const loadNetwork = async (provider, dispatch) => {
  const { chainId } = await provider.getNetwork();
  dispatch({ type: "NETWORK_LOADED", chainId });
  return chainId;
};
export const loadAccount = async (provider, dispatch) => {
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  const account = ethers.utils.getAddress(accounts[0]);
  dispatch({ type: "ACCOUNT_LOADED", account });
  let balance = await provider.getBalance(account);
  balance = ethers.utils.formatEther(balance);
  dispatch({ type: "ETHER_BALANCE_LOADED", balance });
  return account;
};
export const loadTokens = async (provider, addresses, dispatch) => {
  let token, symbol;
  token = new ethers.Contract(addresses[0], TOKEN_ABI, provider);
  symbol = await token.getSymbol();

  dispatch({ type: "TOKEN_1_LOADED", token, symbol });
  token = new ethers.Contract(addresses[1], TOKEN_ABI, provider);
  symbol = await token.getSymbol();

  dispatch({ type: "TOKEN_2_LOADED", token, symbol });
};
export const loadExchange = async (provider, address, dispatch) => {
  const exchange = new ethers.Contract(address, EXCHANGE_ABI, provider);
  dispatch({ type: "EXCHANGE_LOADED", exchange });
  return exchange;
};
export const loadBalance = async (exchange, tokens, account, dispatch) => {
  let balance = ethers.utils.formatEther(await tokens[0].getBalance(account));
  dispatch({ type: "TOKEN_1_BALANCE_LOADED", balance });

  balance = ethers.utils.formatEther(await tokens[1].getBalance(account));
  dispatch({ type: "TOKEN_2_BALANCE_LOADED", balance });
  balance = ethers.utils.formatEther(
    await exchange.getBalance(tokens[0].address, account)
  );
  dispatch({ type: "EXCHANGE_TOKEN_1_BALANCE_LOADED", balance });

  balance = ethers.utils.formatEther(
    await exchange.getBalance(tokens[1].address, account)
  );
  dispatch({ type: "EXCHANGE_TOKEN_2_BALANCE_LOADED", balance });
};

export const transferToken = async (
  provider,
  exchange,
  transferType,
  token,
  amount,
  dispatch
) => {
  let transaction;
  dispatch({ type: "TRANSFER_REQUEST" });
  try {
    const signer = await provider.getSigner();
    const amountToTransfer = ethers.utils.parseEther(amount.toString());
    if (transferType === "Deposit") {
      transaction = await token
        .connect(signer)
        .approve(exchange.address, amountToTransfer);
      transaction.wait();
      transaction = await exchange
        .connect(signer)
        .depositToken(token.address, amountToTransfer);
      transaction.wait();
    } else {
      transaction = await exchange
        .connect(signer)
        .withdrawToken(token.address, amountToTransfer);
    }
  } catch (error) {
    dispatch({ type: "TRANSFER_FAIL" });
  }
};

export const makeBuyOrder = async (
  provider,
  exchange,
  tokens,
  order,
  dispatch
) => {
  let transaction;
  const tokenGet = tokens[0].address;
  const amountGet = ethers.utils.parseEther(order.amount);
  const tokenGive = tokens[1].address;
  const amountGive = ethers.utils.parseEther(
    (order.amount * order.price).toString()
  );
  dispatch({ type: "NEW_ORDER_REQUEST" });
  try {
    const signer = await provider.getSigner();
    transaction = await exchange
      .connect(signer)
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive);
    await transaction.wait();
  } catch (error) {
    dispatch({ type: "NEW_ORDER_FAIL" });
  }
};
export const makeSellOrder = async (
  provider,
  exchange,
  tokens,
  order,
  dispatch
) => {
  let transaction;
  const tokenGet = tokens[1].address;
  const amountGet = ethers.utils.parseEther(
    (order.amount * order.price).toString()
  );
  const tokenGive = tokens[0].address;
  const amountGive = ethers.utils.parseEther(order.amount);
  dispatch({ type: "NEW_ORDER_REQUEST" });
  try {
    const signer = await provider.getSigner();
    transaction = await exchange
      .connect(signer)
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive);
    await transaction.wait();
  } catch (error) {
    dispatch({ type: "NEW_ORDER_FAIL" });
  }
};
export const fillOrder = async (provider, exchange, order, dispatch) => {
  dispatch({ type: "ORDER_FILL_REQUEST" });
  try {
    const signer = await provider.getSigner();
    let transaction = await exchange.connect(signer).fillOrder(order.orderId);
    await transaction.wait();
  } catch (error) {
    dispatch({ type: "ORDER_FILL_FAIL" });
  }
};
export const cancelOrder = async (provider, exchange, order, dispatch) => {
  dispatch({ type: "ORDER_CANCEL_REQUEST" });
  try {
    const signer = await provider.getSigner();
    const transaction = await exchange
      .connect(signer)
      .cancelOrder(order.orderId);
    await transaction.wait();
  } catch (error) {
    dispatch({ type: "ORDER_CANCEL_FAIL" });
  }
};
//LOAD ALL ORDERS
export const loadAllOrders = async (provider, exchange, dispatch) => {
  const block = await provider.getBlockNumber();
  const orderStream = await exchange.queryFilter(
    "Exchange__MakeOrder",
    0,
    block
  );
  const allOrders = orderStream.map((event) => event.args);
  dispatch({ type: "ALL_ORDERS_LOADED", allOrders });
  const cancelStream = await exchange.queryFilter(
    "Exchange__CancelOrder",
    0,
    block
  );
  const cancelledOrders = cancelStream.map((event) => event.args);
  dispatch({ type: "CANCELLED_ORDERS_LOADED", cancelledOrders });
  const tradeStream = await exchange.queryFilter("Exchange__Trade", 0, block);
  const filledOrders = tradeStream.map((event) => event.args);
  dispatch({ type: "FILLED_ORDERS_LOADED", filledOrders });
};

//SUBSCRIPTION
export const subscribeToEvents = async (exchange, dispatch) => {
  exchange.on(
    "Exchange__DepositToken",
    (token, user, amount, balance, event) => {
      dispatch({ type: "TRANSFER_SUCCESS", event });
    }
  );
  exchange.on(
    "Exchange__WithdrawToken",
    (token, user, amount, balance, event) => {
      dispatch({ type: "TRANSFER_SUCCESS", event });
    }
  );
  exchange.on(
    "Exchange__MakeOrder",
    (
      orderId,
      owner,
      tokenGet,
      amountGet,
      tokenGive,
      amountGive,
      timestamp,
      event
    ) => {
      const order = event.args;
      dispatch({ type: "NEW_ORDER_SUCCESS", order, event });
    }
  );
  exchange.on(
    "Exchange__Trade",
    (
      orderId,
      filler,
      tokenGet,
      amountGet,
      tokenGive,
      amountGive,
      owner,
      timeStamp,
      event
    ) => {
      const order = event.args;
      dispatch({ type: "ORDER_FILL_SUCCESS", order, event });
    }
  );
  exchange.on(
    "Exchange__CancelOrder",
    (
      orderId,
      owner,
      tokenGet,
      amountGet,
      tokenGive,
      amountGive,
      timeStamp,
      event
    ) => {
      const order = event.args;
      dispatch({ type: "ORDER_CANCEL_SUCCESS", order, event });
    }
  );

  let a = 0;
  exchange.on("Exchange__TokenPurchased", (owner, token, amount, event) => {
    if (a != 0) {
      window.location.reload();
    }
    a++;
  });
  exchange.on("Exchange__TokenSold", (owner, token, amount, event) => {
    if (a != 0) {
      window.location.reload();
    }
    a++;
  });
};
