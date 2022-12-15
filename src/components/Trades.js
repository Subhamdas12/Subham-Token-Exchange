import { useSelector } from "react-redux";
import sort from "../assets/sort.svg";
import { filledOrdersSelector } from "../store/selectors";
import Banner from "./Banner";
const Trades = () => {
  const symbols = useSelector((state) => state.tokens.symbols);
  const filledOrders = useSelector(filledOrdersSelector);
  return (
    <div className="component exchange__trades">
      <div className="component__header flex-between">
        <h2>Trades</h2>
      </div>
      {!filledOrders || filledOrders === 0 ? (
        <Banner text="No trades" />
      ) : (
        <table>
          <thead>
            <tr>
              <th>
                <img src={sort} alt="sort" />
                Time
              </th>
              <th>
                <img src={sort} alt="sort" />
                {symbols && symbols[0]}
              </th>
              <th>
                <img src={sort} alt="sort" />
                {symbols && symbols[0]} / {symbols && symbols[1]}
              </th>
            </tr>
          </thead>
          <tbody>
            {filledOrders.map((orders, index) => {
              return (
                <tr key={index}>
                  <td>{orders.formattedTimestamp}</td>
                  <td style={{ color: `${orders.tokenPriceClass}` }}>
                    {orders.token0Amount}
                  </td>
                  <td>{orders.tokenPrice}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Trades;
