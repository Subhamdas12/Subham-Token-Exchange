import { useDispatch, useSelector } from "react-redux";
import sort from "../assets/sort.svg";
import { fillOrder } from "../store/interactions";
import { orderBookSelector } from "../store/selectors";
const OrderBook = () => {
  const symbols = useSelector((state) => state.tokens.symbols);
  const orderBook = useSelector(orderBookSelector);
  const provider = useSelector((state) => state.provider.connection);
  const exchange = useSelector((state) => state.exchange.contract);
  const dispatch = useDispatch();
  const fillOrderHandler = (order) => {
    fillOrder(provider, exchange, order, dispatch);
  };
  return (
    <div className="component exchange__orderbook">
      <div className="component__header flex-between">
        <h2>Order Book</h2>
      </div>

      <div className="flex">
        <table className="exchange__orderbook--sell">
          <caption>Selling</caption>
          <thead>
            <tr>
              <th>
                <img src={sort} alt="Sort" />
                {symbols && symbols[0]}
              </th>
              <th>
                <img src={sort} alt="Sort" />
                {symbols && symbols[0]} / {symbols && symbols[1]}
              </th>
              <th>
                <img src={sort} alt="Sort" />
                {symbols && symbols[1]}
              </th>
            </tr>
          </thead>
          <tbody>
            {orderBook &&
              orderBook.sellOrders.map((order, index) => {
                return (
                  <tr key={index} onClick={() => fillOrderHandler(order)}>
                    <td>{order.token0Amount}</td>
                    <td style={{ color: `${order.orderTypeClass}` }}>
                      {order.tokenPrice}
                    </td>
                    <td>{order.token1Amount}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        <div className="divider"></div>

        <table className="exchange__orderbook--buy">
          <caption>Buying</caption>
          <thead>
            <tr>
              <th>
                <img src={sort} alt="Sort" />
                {symbols && symbols[0]}
              </th>
              <th>
                <img src={sort} alt="Sort" />
                {symbols && symbols[0]} / {symbols && symbols[1]}
              </th>
              <th>
                <img src={sort} alt="Sort" />
                {symbols && symbols[1]}
              </th>
            </tr>
          </thead>
          <tbody>
            {orderBook &&
              orderBook.buyOrders.map((order, index) => {
                return (
                  <tr key={index} onClick={() => fillOrderHandler(order)}>
                    <td>{order.token0Amount}</td>
                    <td style={{ color: `${order.orderTypeClass}` }}>
                      {order.tokenPrice}
                    </td>
                    <td>{order.token1Amount}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderBook;
