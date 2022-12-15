import { ethers } from "ethers";
import { get, groupBy, maxBy, minBy, reject } from "lodash";
import moment from "moment/moment";
import { createSelector } from "reselect";
const GREEN = "#25CE8F";
const RED = "#F45353";
const allOrders = (state) => get(state, "exchange.allOrders.data", []);
const tokens = (state) => get(state, "tokens.contracts");
const account = (state) => get(state, "provider.account");
const events = (state) => get(state, "exchange.events");
const cancelledOrders = (state) =>
  get(state, "exchange.cancelledOrders.data", []);
const filledOrders = (state) => get(state, "exchange.filledOrders.data", []);
const openOrders = (state) => {
  const all = allOrders(state);
  const cancelled = cancelledOrders(state);
  const filled = filledOrders(state);
  const openOrders = reject(all, (order) => {
    const orderFilled = filled.some(
      (o) => o.orderId.toString() === order.orderId.toString()
    );
    const orderCancelled = cancelled.some(
      (o) => o.orderId.toString() === order.orderId.toString()
    );
    return orderFilled || orderCancelled;
  });
  return openOrders;
};
export const orderBookSelector = createSelector(
  openOrders,
  tokens,
  (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) {
      return;
    }
    orders = orders.filter(
      (o) =>
        o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address
    );
    orders = orders.filter(
      (o) =>
        o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address
    );
    orders = decorateOrderBookOrders(orders, tokens);
    orders = groupBy(orders, "orderType");
    const buyOrders = get(orders, "BUY", []);
    const sellOrders = get(orders, "SELL", []);
    orders = {
      ...orders,
      buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice),
      sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice),
    };

    return orders;
  }
);

const decorateOrderBookOrders = (orders, tokens) => {
  return orders.map((order) => {
    order = decorateOrder(order, tokens);
    order = decorateOrderBookOrder(order, tokens);
    return order;
  });
};

export const decorateOrder = (order, tokens) => {
  let token0Amount, token1Amount;
  if (order.tokenGive === tokens[1].address) {
    token0Amount = order.amountGive;
    token1Amount = order.amountGet;
  } else {
    token0Amount = order.amountGet;
    token1Amount = order.amountGive;
  }
  const precision = 100000;
  let tokenPrice = token1Amount / token0Amount;
  tokenPrice = Math.round(tokenPrice * precision) / precision;
  return {
    ...order,
    token0Amount: ethers.utils.formatEther(token0Amount),
    token1Amount: ethers.utils.formatEther(token1Amount),
    tokenPrice,
    formattedTimestamp: moment.unix(order.timeStamp).format("h:mm:ssa d MMM D"),
  };
};

export const decorateOrderBookOrder = (order, tokens) => {
  const orderType = order.tokenGive === tokens[1].address ? "BUY" : "SELL";
  return {
    ...order,
    orderType,
    orderTypeClass: orderType === "BUY" ? GREEN : RED,
    orderFillAction: orderType === "BUY" ? "SELL" : "BUY",
  };
};
export const priceChartSelector = createSelector(
  filledOrders,
  tokens,
  (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) {
      return;
    }
    orders = orders.filter(
      (o) =>
        o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address
    );
    orders = orders.filter(
      (o) =>
        o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address
    );
    orders = orders.sort((a, b) => a.timeStamp - b.timeStamp);
    orders = orders.map((o) => decorateOrder(o, tokens));

    let secondLastOrder, lastOrder;
    [secondLastOrder, lastOrder] = orders.slice(
      orders.length - 2,
      orders.length
    );

    const lastPrice = get(lastOrder, "tokenPrice", 0);
    const secondLastPrice = get(secondLastOrder, "tokenPrice", 0);
    return {
      lastPrice,
      lastPriceChange: lastPrice >= secondLastPrice ? "+" : "-",
      series: [
        {
          data: buildGraphData(orders),
        },
      ],
    };
  }
);

const buildGraphData = (orders) => {
  orders = groupBy(orders, (o) =>
    moment.unix(o.timeStamp).startOf("hour").format()
  );
  const hours = Object.keys(orders);
  const graphData = hours.map((hour) => {
    const group = orders[hour];
    const open = group[0];
    const high = maxBy(group, "tokenPrice");
    const low = minBy(group, "tokenPrice");
    const close = group[group.length - 1];
    return {
      x: new Date(hour),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice],
    };
  });
  return graphData;
};

export const filledOrdersSelector = createSelector(
  filledOrders,
  tokens,
  (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) {
      return;
    }
    orders = orders.filter(
      (o) =>
        o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address
    );
    orders = orders.filter(
      (o) =>
        o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address
    );
    orders = orders.sort((a, b) => a.timeStamp - b.timeStamp);
    orders = decorateFilledOrders(orders, tokens);
    orders = orders.sort((a, b) => b.timeStamp - a.timeStamp);
    return orders;
  }
);

const decorateFilledOrders = (orders, tokens) => {
  const prevOrder = orders[0];
  return orders.map((order) => {
    order = decorateOrder(order, tokens);
    order = decorateFilledOrder(order, prevOrder, tokens);
    return order;
  });
};

const decorateFilledOrder = (order, previousOrder, tokens) => {
  return {
    ...order,
    tokenPriceClass: tokenPriceClass(
      order.tokenPrice,
      order.orderId,
      previousOrder
    ),
  };
};
const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
  if (previousOrder.orderId === orderId) {
    return GREEN;
  }
  if (previousOrder.tokenPrice <= tokenPrice) {
    return GREEN;
  } else {
    return RED;
  }
};

export const myOpenOrdersSelector = createSelector(
  account,
  tokens,
  openOrders,
  (account, tokens, orders) => {
    if (!tokens[0] || !tokens[1]) {
      return;
    }
    orders = orders.filter((o) => o.owner === account);
    orders = orders.filter(
      (o) =>
        o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address
    );
    orders = orders.filter(
      (o) =>
        o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address
    );

    orders = decorateMyOpenOrders(orders, tokens);
    orders = orders.sort((a, b) => b.timeStamp - a.timeStamp);
    return orders;
  }
);
const decorateMyOpenOrders = (orders, tokens) => {
  return orders.map((order) => {
    order = decorateOrder(order, tokens);
    order = decorateMyOpenOrder(order, tokens);
    return order;
  });
};

const decorateMyOpenOrder = (order, tokens) => {
  let orderType = order.tokenGive === tokens[1].address ? "buy" : "sell";
  return {
    ...order,
    orderType,
    orderTypeClass: orderType === "buy" ? GREEN : RED,
  };
};

export const myFilledOrdersSelector = createSelector(
  account,
  tokens,
  filledOrders,
  (account, tokens, orders) => {
    if (!tokens[0] || !tokens[1]) return;
    orders = orders.filter((o) => o.owner === account || o.filler === account);
    orders = orders.filter(
      (o) =>
        o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address
    );
    orders = orders.filter(
      (o) =>
        o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address
    );
    orders = orders.sort((a, b) => b.timeStamp - a.timeStamp);
    orders = decorateMyFilledOrders(orders, account, tokens);
    return orders;
  }
);

const decorateMyFilledOrders = (orders, account, tokens) => {
  return orders.map((order) => {
    order = decorateOrder(order, tokens);
    order = decorateMyFilledOrder(order, account, tokens);
    return order;
  });
};

const decorateMyFilledOrder = (order, account, tokens) => {
  const myOrders = order.owner === account;
  let orderType;
  if (myOrders) {
    orderType = order.tokenGive === tokens[1].address ? "buy" : "sell";
  } else {
    orderType = order.tokenGive === tokens[1].address ? "sell" : "buy";
  }
  return {
    ...order,
    orderType,
    orderClass: orderType === "buy" ? GREEN : RED,
    orderSign: orderType === "buy" ? "+" : "-",
  };
};

export const myEventsSelector = createSelector(
  account,
  events,
  (account, events) => {
    events = events.filter((e) => e.args.owner === account);
    return events;
  }
);
