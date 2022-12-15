import { remove } from "lodash";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { myEventsSelector } from "../store/selectors";
import config from "../config.json";
const Alert = () => {
  const alertRef = useRef(null);
  const isPending = useSelector(
    (state) => state.exchange.transaction.isPending
  );
  const event = useSelector(myEventsSelector);
  const isError = useSelector((state) => state.exchange.transaction.isError);
  const account = useSelector((state) => state.provider.account);
  const network = useSelector((state) => state.provider.network);
  const chainId = useSelector((state) => state.provider.chainId);
  const removeHandler = async (e) => {
    alertRef.current.className = "alert--remove";
  };
  useEffect(() => {
    if ((event[0] || isPending || isError) && account) {
      alertRef.current.className = "alert";
    }
  }, [isPending, isError, event]);
  return (
    <div>
      {isPending ? (
        <div
          className="alert alert--remove"
          ref={alertRef}
          onClick={removeHandler}
        >
          <h1>Transaction Pending...</h1>
        </div>
      ) : isError ? (
        <div
          className="alert alert--remove"
          ref={alertRef}
          onClick={removeHandler}
        >
          <h1>Transaction Will Fail</h1>
        </div>
      ) : !isPending && event[0] ? (
        <div
          className="alert alert--remove"
          ref={alertRef}
          onClick={removeHandler}
        >
          <h1>Transaction Successful</h1>
          <a
            href={
              config[chainId]
                ? `${config[chainId].explorerURL}/tx/${event[0].transactionHash}`
                : "#"
            }
            target="_blank"
            rel="noreferrer"
          >
            {event[0].transactionHash.slice(0, 6) +
              "..." +
              event[0].transactionHash.slice(60, 66)}
          </a>
        </div>
      ) : (
        <div
          className="alert alert--remove"
          ref={alertRef}
          onClick={removeHandler}
        ></div>
      )}
    </div>
  );
};

export default Alert;
