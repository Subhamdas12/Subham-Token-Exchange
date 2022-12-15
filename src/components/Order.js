import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { makeBuyOrder, makeSellOrder } from "../store/interactions";

const Order = () => {
  const [isBuy, setIsBuy] = useState(true);
  const [price, setPrice] = useState(0);
  const [amount, setAmount] = useState(0);
  const buyRef = useRef(null);
  const sellRef = useRef(null);
  const provider = useSelector((state) => state.provider.connection);
  const exchange = useSelector((state) => state.exchange.contract);
  const tokens = useSelector((state) => state.tokens.contracts);
  const dispatch = useDispatch();
  const tabHandler = (e) => {
    if (e.target.className !== buyRef.current.className) {
      e.target.className = "tab tab--active";
      buyRef.current.className = "tab";
      setIsBuy(false);
    } else {
      e.target.className = "tab tab--active";
      sellRef.current.className = "tab";
      setIsBuy(true);
    }
  };
  const buyHandler = (e) => {
    e.preventDefault();
    makeBuyOrder(provider, exchange, tokens, { price, amount }, dispatch);
    setPrice(0);
    setAmount(0);
  };
  const sellHandler = (e) => {
    e.preventDefault();
    makeSellOrder(provider, exchange, tokens, { price, amount }, dispatch);
    setPrice(0);
    setAmount(0);
  };
  return (
    <div className="component exchange__orders">
      <div className="component__header flex-between">
        <h2>New Order</h2>
        <div className="tabs">
          <button onClick={tabHandler} ref={buyRef} className="tab tab--active">
            Buy
          </button>
          <button onClick={tabHandler} ref={sellRef} className="tab">
            Sell
          </button>
        </div>
      </div>

      <form onSubmit={isBuy ? buyHandler : sellHandler}>
        {isBuy ? <label>Buy Amount</label> : <label>Sell Amount</label>}
        <input
          type="text"
          id="amount"
          placeholder="0.0000"
          value={amount === 0 ? "" : amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {isBuy ? <label>Buy Price</label> : <label>Sell Price</label>}
        <input
          type="text"
          id="price"
          placeholder="0.0000"
          value={price === 0 ? "" : price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <button className="button button--filled" type="submit">
          {isBuy ? <span>Buy Order</span> : <span>Sell Order</span>}
        </button>
      </form>
    </div>
  );
};

export default Order;