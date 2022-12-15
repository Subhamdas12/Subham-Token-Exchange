import { useDispatch, useSelector } from "react-redux";
import config from "../config.json";
import { loadTokens } from "../store/interactions";
const Markets = () => {
  const chainId = useSelector((state) => state.provider.chainId);
  const provider = useSelector((state) => state.provider.connection);
  const dispatch = useDispatch();
  const marketHandler = async (e) => {
    await loadTokens(provider, e.target.value.split(","), dispatch);
  };
  return (
    <div className="component exchange__markets">
      <div className="component__header">
        <h2>Select Markets</h2>
      </div>
      {chainId && config[chainId] ? (
        <select name="markets" id="markets" onChange={marketHandler}>
          <option
            value={`${config[chainId].subham.address},${config[chainId].mETH.address}`}
          >
            subham / mETH
          </option>
          <option
            value={`${config[chainId].subham.address},${config[chainId].mDAI.address}`}
          >
            subham / mDAI
          </option>
        </select>
      ) : (
        <p>Not deployed to network</p>
      )}
      <hr />
    </div>
  );
};

export default Markets;
