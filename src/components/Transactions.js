import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  myFilledOrdersSelector,
  myOpenOrdersSelector,
} from "../store/selectors";
import sort from "../assets/sort.svg";
import Banner from "./Banner";
import { cancelOrder } from "../store/interactions";

const Transactions = () => {
  const orderRef = useRef(null);
  const tradeRef = useRef(null);
  const [showMyOrder, setShowMyOrder] = useState(true);
  const myOpenOrders = useSelector(myOpenOrdersSelector);
  const myFilledOrders = useSelector(myFilledOrdersSelector);
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.provider.connection);
  const exchange = useSelector((state) => state.exchange.contract);
  const symbols = useSelector((state) => state.tokens.symbols);
  const tabHandler = (e) => {
    if (e.target.className !== orderRef.current.className) {
      e.target.className = "tab tab--active";
      orderRef.current.className = "tab";
      setShowMyOrder(false);
    } else {
      e.target.className = "tab tab--active";
      tradeRef.current.className = "tab";
      setShowMyOrder(true);
    }
  };
  const cancelHandler = (order) => {
    cancelOrder(provider, exchange, order, dispatch);
  };
  return (
    <div className="component exchange__transactions">
      {showMyOrder ? (
        <div>
          <div className="component__header flex-between">
            <h2>My Orders</h2>

            <div className="tabs">
              <button
                ref={orderRef}
                onClick={tabHandler}
                className="tab tab--active"
              >
                Orders
              </button>
              <button ref={tradeRef} onClick={tabHandler} className="tab">
                Trades
              </button>
            </div>
          </div>
          {!myOpenOrders || myOpenOrders.length === 0 ? (
            <Banner text="No Orders" />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>
                    <img src={sort} alt="sort" />
                    {symbols && symbols[0]}
                  </th>
                  <th>
                    {symbols && symbols[0]} / {symbols && symbols[1]}
                    <img src={sort} alt="sort" />
                  </th>
                  <th>Cancel Orders</th>
                </tr>
              </thead>
              <tbody>
                {myOpenOrders &&
                  myOpenOrders.map((order, index) => {
                    return (
                      <tr key={index}>
                        <td style={{ color: `${order.orderTypeClass}` }}>
                          {order.token0Amount}
                        </td>
                        <td>{order.tokenPrice}</td>
                        <td>
                          <button
                            className="button--sm"
                            onClick={() => cancelHandler(order)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div>
          <div className="component__header flex-between">
            <h2>My Transactions</h2>
            <div className="tabs">
              <button
                ref={orderRef}
                onClick={tabHandler}
                className="tab tab--active"
              >
                Orders
              </button>
              <button ref={tradeRef} onClick={tabHandler} className="tab">
                Trades
              </button>
            </div>
          </div>
          {!myFilledOrders || myFilledOrders.length === 0 ? (
            <Banner text="No Transactions" />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>
                    Time <img src={sort} alt="" />{" "}
                  </th>
                  <th>
                    {symbols && symbols[0]}
                    <img src={sort} alt="" />
                  </th>
                  <th>
                    {symbols && symbols[0]} / {symbols && symbols[1]}
                    <img src={sort} alt="" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {myFilledOrders &&
                  myFilledOrders.map((order, index) => {
                    return (
                      <tr key={index}>
                        <td>{order.formattedTimestamp}</td>
                        <td style={{ color: `${order.orderClass}` }}>
                          {order.orderSign}
                          {order.token0Amount}
                        </td>
                        <td>{order.tokenPrice}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Transactions;
