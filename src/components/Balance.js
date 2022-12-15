import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import logo from "../assets/logo.png";
import eth from "../assets/eth.svg";
import { loadBalance, transferToken } from "../store/interactions";
const Balance = () => {
  const depositRef = useRef(null);
  const withdrawRef = useRef(null);
  const symbol = useSelector((state) => state.tokens.symbols);
  const [isDeposit, setIsDeposit] = useState(true);
  const [token1TransferAmount, setToken1TransferAmount] = useState(0);
  const [token2TransferAmount, setToken2TransferAmount] = useState(0);
  const tokens = useSelector((state) => state.tokens.contracts);
  const exchange = useSelector((state) => state.exchange.contract);
  const isPending = useSelector(
    (state) => state.exchange.transaction.isPending
  );
  const bsTransfer = useSelector((state) => state.exchange.bsTransfer);
  const transferInProgress = useSelector(
    (state) => state.exchange.transferInProgress
  );
  const provider = useSelector((state) => state.provider.connection);
  const tokenBalance = useSelector((state) => state.tokens.balances);
  const exchangeBalance = useSelector((state) => state.exchange.balances);
  const account = useSelector((state) => state.provider.account);
  const dispatch = useDispatch();
  const tabHandler = (e) => {
    if (e.target.className !== depositRef.current.className) {
      e.target.className = "tab tab--active";
      depositRef.current.className = "tab";
      setIsDeposit(false);
    } else {
      e.target.className = "tab tab--active";
      withdrawRef.current.className = "tab";
      setIsDeposit(true);
    }
  };
  const amountHandler = (e, token) => {
    if (token.address === tokens[0].address) {
      setToken1TransferAmount(e.target.value);
    } else {
      setToken2TransferAmount(e.target.value);
    }
  };
  const depositHandler = (e, token) => {
    e.preventDefault();
    if (token.address === tokens[0].address) {
      transferToken(
        provider,
        exchange,
        "Deposit",
        tokens[0],
        token1TransferAmount,
        dispatch
      );
      setToken1TransferAmount(0);
    } else {
      transferToken(
        provider,
        exchange,
        "Deposit",
        tokens[1],
        token2TransferAmount,
        dispatch
      );
      setToken2TransferAmount(0);
    }
  };
  const withdrawHandler = (e, token) => {
    e.preventDefault();
    if (token.address === tokens[0].address) {
      transferToken(
        provider,
        exchange,
        "Withdraw",
        tokens[0],
        token1TransferAmount,
        dispatch
      );
      setToken1TransferAmount(0);
    } else {
      transferToken(
        provider,
        exchange,
        "Withdraw",
        tokens[1],
        token2TransferAmount,
        dispatch
      );
      setToken2TransferAmount(0);
    }
  };

  useEffect(() => {
    if (tokens[0] && tokens[1] && exchange && account) {
      loadBalance(exchange, tokens, account, dispatch);
    }
  }, [
    exchange,
    tokens,
    account,
    dispatch,
    transferInProgress,
    isPending,
    bsTransfer,
  ]);
  return (
    <div className="component exchange__transfers">
      <div className="component__header flex-between">
        <h2>Balance</h2>
        <div className="tabs">
          <button
            ref={depositRef}
            onClick={tabHandler}
            className="tab tab--active"
          >
            Deposit
          </button>
          <button ref={withdrawRef} onClick={tabHandler} className="tab">
            Withdraw
          </button>
        </div>
      </div>

      {/* Deposit/Withdraw Component 1 (DApp) */}

      <div className="exchange__transfers--form">
        <div className="flex-between">
          <p>
            <small>Token</small>
            <br />
            <img src={logo} className="logo2" alt="" />
            {symbol && symbol[0]}
          </p>
          <p>
            <small>Wallet</small>
            <br />
            {tokenBalance && tokenBalance[0]}
            <br />
          </p>
          <p>
            <small>Exchange</small>
            <br />
            {exchangeBalance && exchangeBalance[0]}
            <br />
          </p>
        </div>

        <form
          onSubmit={
            isDeposit
              ? (e) => depositHandler(e, tokens[0])
              : (e) => withdrawHandler(e, tokens[0])
          }
        >
          <label htmlFor="token0"></label>
          <input
            type="text"
            id="token0"
            placeholder="0.0000"
            value={token1TransferAmount === 0 ? "" : token1TransferAmount}
            onChange={(e) => amountHandler(e, tokens[0])}
          />
          <button className="button" type="submit">
            <span>{isDeposit ? `Deposit` : `Withdraw`}</span>
          </button>
        </form>
      </div>

      <hr />

      {/* Deposit/Withdraw Component 2 (mETH) */}

      <div className="exchange__transfers--form">
        <div className="flex-between">
          <p>
            <small>Token</small>
            <br />
            <img src={eth} className="logo2" alt="" />
            {symbol && symbol[1]}
          </p>
          <p>
            <small>Wallet</small>
            <br />
            {tokenBalance && tokenBalance[1]}
            <br />
          </p>
          <p>
            <small>Exchange</small>
            <br />
            {exchangeBalance && exchangeBalance[1]}
            <br />
          </p>
        </div>

        <form
          onSubmit={
            isDeposit
              ? (e) => depositHandler(e, tokens[1])
              : (e) => withdrawHandler(e, tokens[1])
          }
        >
          <label htmlFor="token1"></label>
          <input
            type="text"
            id="token1"
            placeholder="0.0000"
            value={token2TransferAmount === 0 ? "" : token2TransferAmount}
            onChange={(e) => amountHandler(e, tokens[1])}
          />

          <button className="button" type="submit">
            <span>{isDeposit ? `Deposit` : `Withdraw`}</span>
          </button>
        </form>
      </div>

      <hr />
    </div>
  );
};

export default Balance;
